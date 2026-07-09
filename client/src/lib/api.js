import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { mockClients } from '../data/mockData'
import { auth, db, isFirebaseConfigured } from './firebase'

const LOCAL_CLIENTS_KEY = 'legal-crm-clients'
const LOCAL_AUTH_KEY = 'legal-crm-admin-session'
const LOCAL_SETTINGS_KEY = 'legal-crm-settings'
const CLIENTS_COLLECTION = 'clients'
const SETTINGS_COLLECTION = 'settings'
const TELEGRAM_SETTINGS_DOCUMENT = 'telegram'
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000'
const fallbackAdminEmail = import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@legalcrm.local'
const fallbackAdminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? 'Admin12345!'
const CLIENT_STATUSES = ['Новый', 'В работе', 'Закрыт']

function mapTimestamp(value) {
  if (!value) {
    return new Date().toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  return value?.toDate?.()?.toISOString?.() ?? new Date().toISOString()
}

function normalizeStatus(status) {
  return CLIENT_STATUSES.includes(status) ? status : 'Новый'
}

function normalizeClient(client) {
  return {
    id: client?.id ? String(client.id) : '',
    fullName: client?.fullName ?? '',
    phone: client?.phone ?? '',
    status: normalizeStatus(client?.status),
    createdAt: mapTimestamp(client?.createdAt),
    updatedAt: mapTimestamp(client?.updatedAt),
    activities: Array.isArray(client?.activities) ? client.activities : [],
  }
}

function normalizeTelegramSettings(settings) {
  return {
    enabled: Boolean(settings?.enabled),
    linkedChatId: settings?.linkedChatId
      ? String(settings.linkedChatId).trim()
      : settings?.chatId
        ? String(settings.chatId).trim()
        : '',
    linkedUsername: settings?.linkedUsername ? String(settings.linkedUsername).trim() : '',
    pairingCode: settings?.pairingCode ? String(settings.pairingCode).trim() : '',
    pairingCodeExpiresAt: settings?.pairingCodeExpiresAt ? mapTimestamp(settings.pairingCodeExpiresAt) : '',
  }
}

function buildClientWritePayload(client) {
  return {
    fullName: client.fullName,
    phone: client.phone,
    status: client.status,
    activities: client.activities,
  }
}

function readLocalClients() {
  const raw = localStorage.getItem(LOCAL_CLIENTS_KEY)

  if (!raw) {
    const seeded = mockClients.map((client) => normalizeClient(client))
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(seeded))
    return seeded
  }

  try {
    return JSON.parse(raw).map((client) => normalizeClient(client))
  } catch {
    localStorage.removeItem(LOCAL_CLIENTS_KEY)
    return readLocalClients()
  }
}

function writeLocalClients(clients) {
  localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(clients))
}

function readLocalSettings() {
  const raw = localStorage.getItem(LOCAL_SETTINGS_KEY)

  if (!raw) {
    const seeded = {
      telegram: normalizeTelegramSettings(null),
    }
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(seeded))
    return seeded
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      telegram: normalizeTelegramSettings(parsed?.telegram),
    }
  } catch {
    localStorage.removeItem(LOCAL_SETTINGS_KEY)
    return readLocalSettings()
  }
}

function writeLocalSettings(settings) {
  localStorage.setItem(
    LOCAL_SETTINGS_KEY,
    JSON.stringify({
      telegram: normalizeTelegramSettings(settings?.telegram),
    }),
  )
}

function createActivity(title, details = '') {
  return {
    id: crypto.randomUUID(),
    title,
    details,
    occurredAt: new Date().toISOString(),
  }
}

function getCurrentLocalUser() {
  const raw = localStorage.getItem(LOCAL_AUTH_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(LOCAL_AUTH_KEY)
    return null
  }
}

function generatePairingCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function getAllFirebaseClients() {
  const snapshot = await getDocs(query(collection(db, CLIENTS_COLLECTION), orderBy('updatedAt', 'desc')))

  return snapshot.docs.map((clientDocument) =>
    normalizeClient({
      id: clientDocument.id,
      ...clientDocument.data(),
    }),
  )
}

function toReadableErrorMessage(error, fallbackMessage) {
  const errorCode = typeof error?.code === 'string' ? error.code : ''

  if (errorCode === 'permission-denied') {
    return 'Firebase отклонил операцию. Проверьте правила доступа Firestore для авторизованного администратора.'
  }

  if (errorCode === 'unauthenticated') {
    return 'Сессия администратора недействительна. Войдите заново и повторите действие.'
  }

  return fallbackMessage
}

export async function signInAdmin(email, password) {
  if (isFirebaseConfigured && auth) {
    await setPersistence(auth, browserLocalPersistence)
    const result = await signInWithEmailAndPassword(auth, email, password)

    return {
      uid: result.user.uid,
      email: result.user.email,
      source: 'firebase',
    }
  }

  if (email !== fallbackAdminEmail || password !== fallbackAdminPassword) {
    throw new Error('Неверные данные администратора')
  }

  const localUser = {
    uid: 'local-admin',
    email,
    source: 'local',
  }

  localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localUser))
  window.dispatchEvent(new Event('legal-crm-auth'))
  return localUser
}

export async function signOutAdmin() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth)
    return
  }

  localStorage.removeItem(LOCAL_AUTH_KEY)
  window.dispatchEvent(new Event('legal-crm-auth'))
}

export function observeAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? { uid: user.uid, email: user.email, source: 'firebase' } : null)
    })
  }

  const handleLocalChange = () => {
    callback(getCurrentLocalUser())
  }

  handleLocalChange()
  window.addEventListener('storage', handleLocalChange)
  window.addEventListener('legal-crm-auth', handleLocalChange)

  return () => {
    window.removeEventListener('storage', handleLocalChange)
    window.removeEventListener('legal-crm-auth', handleLocalChange)
  }
}

export async function getClients() {
  if (isFirebaseConfigured && db) {
    return getAllFirebaseClients()
  }

  return readLocalClients()
}

export async function getClient(clientId) {
  if (isFirebaseConfigured && db) {
    const clientSnapshot = await getDoc(doc(db, CLIENTS_COLLECTION, String(clientId)))

    if (!clientSnapshot.exists()) {
      return null
    }

    return normalizeClient({
      id: clientSnapshot.id,
      ...clientSnapshot.data(),
    })
  }

  return readLocalClients().find((client) => String(client.id) === String(clientId)) ?? null
}

export async function createClient(payload) {
  const now = new Date().toISOString()
  const nextClient = normalizeClient({
    ...payload,
    createdAt: now,
    updatedAt: now,
    activities: [createActivity('Создана карточка клиента', 'Запись добавлена администратором.')],
  })

  if (isFirebaseConfigured && db) {
    try {
      const result = await addDoc(collection(db, CLIENTS_COLLECTION), {
        ...buildClientWritePayload(nextClient),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return {
        ...nextClient,
        id: result.id,
      }
    } catch (error) {
      throw new Error(toReadableErrorMessage(error, 'Не удалось сохранить клиента в Firestore.'))
    }
  }

  const clients = readLocalClients()
  const clientWithId = { ...nextClient, id: crypto.randomUUID() }
  writeLocalClients([clientWithId, ...clients])
  return clientWithId
}

export async function updateClient(clientId, payload) {
  const currentClient = await getClient(clientId)

  if (!currentClient) {
    throw new Error('Клиент не найден')
  }

  const updatedClient = normalizeClient({
    ...currentClient,
    ...payload,
    updatedAt: new Date().toISOString(),
    activities: [
      createActivity('Данные клиента обновлены', 'Администратор изменил карточку клиента.'),
      ...(payload.activities ?? currentClient.activities ?? []),
    ],
  })

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, CLIENTS_COLLECTION, String(clientId)), {
        ...buildClientWritePayload(updatedClient),
        updatedAt: serverTimestamp(),
      })

      return updatedClient
    } catch (error) {
      throw new Error(toReadableErrorMessage(error, 'Не удалось обновить клиента в Firestore.'))
    }
  }

  const clients = readLocalClients().map((client) =>
    String(client.id) === String(clientId) ? updatedClient : client,
  )
  writeLocalClients(clients)
  return updatedClient
}

export async function deleteClient(clientId) {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, CLIENTS_COLLECTION, String(clientId)))
      return
    } catch (error) {
      throw new Error(toReadableErrorMessage(error, 'Не удалось удалить клиента из Firestore.'))
    }
  }

  const clients = readLocalClients().filter((client) => String(client.id) !== String(clientId))
  writeLocalClients(clients)
}

export async function getDashboard() {
  const clients = await getClients()
  const closedClients = clients.filter((client) => client.status === 'Закрыт').length
  const activeClients = clients.filter((client) => client.status === 'В работе').length
  const newClients = clients.filter((client) => client.status === 'Новый').length
  const allActivities = clients
    .flatMap((client) =>
      (client.activities ?? []).map((activity) => ({
        ...activity,
        clientName: client.fullName,
      })),
    )
    .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt))
    .slice(0, 4)

  const closedRate = clients.length ? Math.round((closedClients / clients.length) * 100) : 0

  return {
    stats: [
      { label: 'Всего клиентов', value: String(clients.length), meta: 'База', tone: 'primary' },
      { label: 'Новые обращения', value: String(newClients), meta: 'Ожидают старта', tone: 'blue' },
      { label: 'Активные дела', value: String(activeClients), meta: 'В работе', tone: 'orange' },
      { label: 'Закрытые дела', value: String(closedClients), meta: 'Завершены', tone: 'green' },
      { label: 'Доля закрытых дел', value: `${closedRate}%`, meta: 'Конверсия', tone: 'slate', progress: closedRate },
    ],
    recentActivities: allActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      subtitle: activity.clientName,
      time: new Date(activity.occurredAt).toLocaleString('ru-RU'),
    })),
    tasks: [],
  }
}

export async function getSettings() {
  if (isFirebaseConfigured && db) {
    const snapshot = await getDoc(doc(db, SETTINGS_COLLECTION, TELEGRAM_SETTINGS_DOCUMENT))

    return {
      telegram: normalizeTelegramSettings(snapshot.exists() ? snapshot.data() : null),
    }
  }

  return readLocalSettings()
}

export async function updateTelegramSettings(payload) {
  const currentSettings = await getSettings()
  const telegram = {
    ...currentSettings.telegram,
    ...(Object.prototype.hasOwnProperty.call(payload, 'enabled') ? { enabled: Boolean(payload.enabled) } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'linkedChatId')
      ? { linkedChatId: payload.linkedChatId ? String(payload.linkedChatId).trim() : '' }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'linkedUsername')
      ? { linkedUsername: payload.linkedUsername ? String(payload.linkedUsername).trim() : '' }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'pairingCode')
      ? { pairingCode: payload.pairingCode ? String(payload.pairingCode).trim() : '' }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'pairingCodeExpiresAt')
      ? { pairingCodeExpiresAt: payload.pairingCodeExpiresAt ? String(payload.pairingCodeExpiresAt) : '' }
      : {}),
  }

  if (isFirebaseConfigured && db) {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, TELEGRAM_SETTINGS_DOCUMENT),
      {
        ...telegram,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    return { telegram }
  }

  const nextSettings = { telegram }
  writeLocalSettings(nextSettings)
  return nextSettings
}

export async function createTelegramPairingCode() {
  const currentSettings = await getSettings()
  const pairingCode = generatePairingCode()
  const pairingCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  const telegram = {
    ...currentSettings.telegram,
    pairingCode,
    pairingCodeExpiresAt,
  }

  return updateTelegramSettings(telegram)
}

export async function unlinkTelegramChat() {
  const currentSettings = await getSettings()
  const telegram = {
    ...currentSettings.telegram,
    linkedChatId: '',
    linkedUsername: '',
    pairingCode: '',
    pairingCodeExpiresAt: '',
  }

  return updateTelegramSettings(telegram)
}

export async function getTelegramBotStatus() {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/integrations/telegram/status`)

    if (!response.ok) {
      throw new Error('Telegram status request failed')
    }

    return await response.json()
  } catch {
    return {
      configured: false,
      running: false,
      botUsername: '',
      firestoreReady: isFirebaseConfigured,
      enabled: false,
      linkedChatId: '',
      linkedChatConfigured: false,
      pairingCodeActive: false,
      unavailable: true,
    }
  }
}
