import { FieldValue } from 'firebase-admin/firestore'
import TelegramBot from 'node-telegram-bot-api'
import { adminDb, isFirebaseAdminConfigured } from './firebaseAdmin.js'

const SETTINGS_COLLECTION = 'settings'
const TELEGRAM_SETTINGS_DOCUMENT = 'telegram'
const CLIENTS_COLLECTION = 'clients'
const KNOWN_STATUSES = ['Новый', 'В работе', 'Закрыт']

const bridgeState = {
  configured: false,
  running: false,
  botUsername: '',
  firestoreReady: isFirebaseAdminConfigured,
  enabled: false,
  linkedChatId: '',
  linkedUsername: '',
  linkedChatConfigured: false,
  pairingCodeActive: false,
  lastError: '',
}

let bot = null
let integrationSettings = {
  enabled: false,
  linkedChatId: '',
  linkedUsername: '',
  pairingCode: '',
  pairingCodeExpiresAt: '',
}
let clientsInitialized = false
const clientStatusMap = new Map()
const clientNotificationMap = new Map()

function normalizeStatus(status) {
  return KNOWN_STATUSES.includes(status) ? status : 'Новый'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getTelegramSettingsRef() {
  return adminDb.collection(SETTINGS_COLLECTION).doc(TELEGRAM_SETTINGS_DOCUMENT)
}

function getClientsCollectionRef() {
  return adminDb.collection(CLIENTS_COLLECTION)
}

function hasActivePairingCode() {
  if (!integrationSettings.pairingCode || !integrationSettings.pairingCodeExpiresAt) {
    return false
  }

  return new Date(integrationSettings.pairingCodeExpiresAt).getTime() > Date.now()
}

function syncBridgeState() {
  bridgeState.enabled = integrationSettings.enabled
  bridgeState.linkedChatId = integrationSettings.linkedChatId
  bridgeState.linkedUsername = integrationSettings.linkedUsername
  bridgeState.linkedChatConfigured = Boolean(integrationSettings.linkedChatId)
  bridgeState.pairingCodeActive = hasActivePairingCode()
}

async function ensureLinkedUsername() {
  if (!bot || !integrationSettings.linkedChatId || integrationSettings.linkedUsername) {
    return
  }

  try {
    const chat = await bot.getChat(integrationSettings.linkedChatId)
    const username = chat?.username ? `@${chat.username}` : ''

    if (!username) {
      return
    }

    await getTelegramSettingsRef().set(
      {
        linkedUsername: username,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    bridgeState.lastError = error.message
  }
}

function isAllowedChat(chatId) {
  return String(chatId) === String(integrationSettings.linkedChatId)
}

function formatClientMessage(title, client, extraLines = []) {
  return [
    `<b>${escapeHtml(title)}</b>`,
    '',
    `Имя: <b>${escapeHtml(client.fullName)}</b>`,
    `Телефон: <code>${escapeHtml(client.phone || 'Не указан')}</code>`,
    `Статус: <b>${escapeHtml(normalizeStatus(client.status))}</b>`,
    ...extraLines,
  ].join('\n')
}

async function sendToConfiguredChat(message) {
  if (!bot || !integrationSettings.enabled || !integrationSettings.linkedChatId) {
    return
  }

  await bot.sendMessage(String(integrationSettings.linkedChatId), message, {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
}

async function buildStatsMessage() {
  const snapshot = await getClientsCollectionRef().get()
  const counts = {
    Новый: 0,
    'В работе': 0,
    Закрыт: 0,
  }

  for (const clientDocument of snapshot.docs) {
    const status = normalizeStatus(clientDocument.data()?.status)
    counts[status] += 1
  }

  return [
    '<b>Статистика Legal CRM</b>',
    '',
    `Новый: <b>${counts['Новый']}</b>`,
    `В работе: <b>${counts['В работе']}</b>`,
    `Закрыт: <b>${counts['Закрыт']}</b>`,
    '',
    `Всего клиентов: <b>${snapshot.size}</b>`,
  ].join('\n')
}

function mapClientDocument(clientDocument) {
  const data = clientDocument.data() ?? {}

  return {
    id: clientDocument.id,
    fullName: data.fullName ?? 'Без имени',
    phone: data.phone ?? '',
    status: normalizeStatus(data.status),
    updatedAt:
      data?.updatedAt?.toDate?.()?.toISOString?.() ??
      (typeof data?.updatedAt === 'string' ? data.updatedAt : ''),
  }
}

function getNotificationSignature(client) {
  return `${client.status}::${client.updatedAt || 'no-updated-at'}`
}

function subscribeToTelegramSettings() {
  getTelegramSettingsRef().onSnapshot((snapshot) => {
    const data = snapshot.exists ? snapshot.data() : null

    integrationSettings = {
      enabled: Boolean(data?.enabled),
      linkedChatId: data?.linkedChatId
        ? String(data.linkedChatId).trim()
        : data?.chatId
          ? String(data.chatId).trim()
          : '',
      linkedUsername: data?.linkedUsername ? String(data.linkedUsername).trim() : '',
      pairingCode: data?.pairingCode ? String(data.pairingCode).trim() : '',
      pairingCodeExpiresAt:
        data?.pairingCodeExpiresAt?.toDate?.()?.toISOString?.() ??
        (typeof data?.pairingCodeExpiresAt === 'string' ? data.pairingCodeExpiresAt : ''),
    }

    syncBridgeState()
    void ensureLinkedUsername()
  })
}

function subscribeToClients() {
  getClientsCollectionRef().onSnapshot(
    async (snapshot) => {
      if (!clientsInitialized) {
        snapshot.docs.forEach((clientDocument) => {
          clientStatusMap.set(clientDocument.id, normalizeStatus(clientDocument.data()?.status))
        })
        clientsInitialized = true
        return
      }

      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') {
          clientStatusMap.delete(change.doc.id)
          clientNotificationMap.delete(change.doc.id)
          continue
        }

        const client = mapClientDocument(change.doc)
        const previousStatus = clientStatusMap.get(change.doc.id)
        const nextSignature = getNotificationSignature(client)
        const previousSignature = clientNotificationMap.get(change.doc.id)

        clientStatusMap.set(change.doc.id, client.status)

        if (change.type === 'added') {
          clientNotificationMap.set(change.doc.id, nextSignature)
          await sendToConfiguredChat(
            formatClientMessage('Новый клиент в Legal CRM', client, [`ID: <code>${escapeHtml(client.id)}</code>`]),
          )
          continue
        }

        if (
          change.type === 'modified' &&
          previousStatus &&
          previousStatus !== client.status &&
          previousSignature !== nextSignature
        ) {
          clientNotificationMap.set(change.doc.id, nextSignature)
          await sendToConfiguredChat(
            formatClientMessage('Изменен статус клиента', client, [
              `Было: <b>${escapeHtml(previousStatus)}</b>`,
              `Стало: <b>${escapeHtml(client.status)}</b>`,
            ]),
          )
        }
      }
    },
    (error) => {
      bridgeState.lastError = error.message
    },
  )
}

async function linkChatByCode(message, code) {
  if (!hasActivePairingCode()) {
    return {
      ok: false,
      message: 'Активный код привязки не найден или уже истек. Сгенерируйте новый код в CRM.',
    }
  }

  if (String(code).trim() !== integrationSettings.pairingCode) {
    return {
      ok: false,
      message: 'Код не совпадает. Проверьте его в CRM и попробуйте снова.',
    }
  }

  await getTelegramSettingsRef().set(
    {
      linkedChatId: String(message.chat.id),
      linkedUsername: message.from?.username ? `@${message.from.username}` : '',
      pairingCode: FieldValue.delete(),
      pairingCodeExpiresAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  return {
    ok: true,
    message: 'Telegram успешно привязан. Теперь вы будете получать уведомления, а команда /stats доступна.',
  }
}

function registerBotCommands() {
  bot.onText(/^\/start(?:@\w+)?$/, async (message) => {
    await bot.sendMessage(
      message.chat.id,
      [
        '<b>Legal CRM Bot</b>',
        '',
        'Для привязки откройте CRM, сгенерируйте код и отправьте его сюда одним сообщением.',
        'Пример: <code>123456</code>',
        '',
        'После привязки будут доступны уведомления и команда /stats.',
      ].join('\n'),
      { parse_mode: 'HTML' },
    )
  })

  bot.onText(/^\/stats(?:@\w+)?$/, async (message) => {
    if (!integrationSettings.linkedChatId) {
      await bot.sendMessage(
        message.chat.id,
        'Интеграция Telegram еще не завершена. Сначала привяжите чат через код из CRM.',
      )
      return
    }

    if (!isAllowedChat(message.chat.id)) {
      await bot.sendMessage(message.chat.id, 'Эта команда доступна только для привязанного Telegram-аккаунта администратора.')
      return
    }

    await bot.sendMessage(message.chat.id, await buildStatsMessage(), {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
  })

  bot.on('message', async (message) => {
    const text = message.text?.trim()

    if (!text || text.startsWith('/')) {
      return
    }

    if (!/^\d{6}$/.test(text)) {
      return
    }

    const result = await linkChatByCode(message, text)
    await bot.sendMessage(message.chat.id, result.message)
  })
}

export function getTelegramBridgeStatus() {
  return {
    ...bridgeState,
  }
}

export async function startTelegramBridge() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    bridgeState.lastError = 'TELEGRAM_BOT_TOKEN is missing'
    return bridgeState
  }

  if (!adminDb) {
    bridgeState.lastError = 'Firebase Admin is not configured'
    return bridgeState
  }

  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

  try {
    const me = await bot.getMe()

    bridgeState.configured = true
    bridgeState.running = true
    bridgeState.botUsername = me.username ? `@${me.username}` : ''
    bridgeState.lastError = ''

    subscribeToTelegramSettings()
    subscribeToClients()
    registerBotCommands()
    syncBridgeState()
    void ensureLinkedUsername()

    return bridgeState
  } catch (error) {
    bridgeState.lastError = error.message
    bridgeState.running = false
    return bridgeState
  }
}
