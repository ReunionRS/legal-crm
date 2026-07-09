import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import {
  createTelegramPairingCode,
  getSettings,
  unlinkTelegramChat,
  updateTelegramSettings,
} from '../lib/api'

const TELEGRAM_BOT_USERNAME = '@cr222mbot'

const emptyTelegramSettings = {
  enabled: false,
  linkedChatId: '',
  linkedUsername: '',
  pairingCode: '',
  pairingCodeExpiresAt: '',
}

function formatExpiresAt(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [telegram, setTelegram] = useState(emptyTelegramSettings)

  const hasActiveCode = useMemo(() => {
    if (!telegram.pairingCode || !telegram.pairingCodeExpiresAt) {
      return false
    }

    return new Date(telegram.pairingCodeExpiresAt).getTime() > Date.now()
  }, [telegram.pairingCode, telegram.pairingCodeExpiresAt])

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const settings = await getSettings()
      setTelegram(settings.telegram ?? emptyTelegramSettings)
    } catch {
      setError('Не удалось загрузить настройки Telegram.')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(enabled) {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const nextSettings = await updateTelegramSettings({ enabled })
      setTelegram(nextSettings.telegram)
      setSuccess(enabled ? 'Уведомления Telegram включены.' : 'Уведомления Telegram выключены.')
    } catch (nextError) {
      setError(nextError.message || 'Не удалось обновить Telegram-интеграцию.')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerateCode() {
    setError('')
    setSuccess('')
    setLinking(true)

    try {
      const nextSettings = await createTelegramPairingCode()
      setTelegram(nextSettings.telegram)
      setSuccess(`Код привязки сгенерирован. Отправьте его боту ${TELEGRAM_BOT_USERNAME} после команды /start.`)
    } catch (nextError) {
      setError(nextError.message || 'Не удалось сгенерировать код привязки.')
    } finally {
      setLinking(false)
    }
  }

  async function handleUnlink() {
    setError('')
    setSuccess('')
    setUnlinking(true)

    try {
      const nextSettings = await unlinkTelegramChat()
      setTelegram(nextSettings.telegram)
      setSuccess('Telegram-аккаунт отвязан.')
    } catch (nextError) {
      setError(nextError.message || 'Не удалось отвязать Telegram-аккаунт.')
    } finally {
      setUnlinking(false)
    }
  }

  if (loading) {
    return <div className="fade-up text-sm text-on-surface-variant">Загрузка настроек...</div>
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Настройки"
        description="Привязка Telegram-аккаунта администратора и управление уведомлениями CRM."
      />

      {error ? <p className="mb-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}
      {success ? <p className="mb-6 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">{success}</p> : null}

      <section className="card-panel overflow-hidden">
        <div className="border-b border-outline-variant bg-surface-container-low px-6 py-4">
          <h3 className="text-xl font-semibold">Интеграция с Telegram</h3>
        </div>

        <div className="space-y-6 p-6 md:p-8">
          <ToggleRow
            title="Включить уведомления"
            description="После включения бот будет отправлять сообщения о новых клиентах и смене статуса."
            checked={telegram.enabled}
            disabled={saving}
            onChange={handleToggle}
          />

          <div className="rounded-3xl border border-outline-variant bg-surface-container-low p-5">
            <h4 className="text-base font-semibold text-on-surface">Привязка Telegram</h4>
            <p className="mt-2 text-sm text-on-surface-variant">
              Сгенерируйте код в CRM и отправьте его боту <strong>{TELEGRAM_BOT_USERNAME}</strong> после команды <code>/start</code>.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={linking}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
              >
                {linking ? 'Генерация...' : hasActiveCode ? 'Сгенерировать новый код' : 'Сгенерировать код'}
              </button>

              {telegram.linkedChatId ? (
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:cursor-wait disabled:opacity-70"
                >
                  {unlinking ? 'Отвязка...' : 'Отвязать Telegram'}
                </button>
              ) : null}
            </div>

            {telegram.linkedUsername ? (
              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Привязанный аккаунт
                </p>
                <p className="mt-2 text-lg font-semibold text-on-surface">{telegram.linkedUsername}</p>
              </div>
            ) : telegram.linkedChatId ? (
              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
                Аккаунт привязан. Username появится после следующей синхронизации бота.
              </div>
            ) : null}

            {hasActiveCode ? (
              <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Код привязки
                </p>
                <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-on-surface">{telegram.pairingCode}</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Действует до {formatExpiresAt(telegram.pairingCodeExpiresAt)}
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
                Активного кода сейчас нет.
              </p>
            )}

            <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">Как это работает</p>
              <p className="mt-2">1. Нажмите «Сгенерировать код».</p>
              <p>2. Откройте бота <strong>{TELEGRAM_BOT_USERNAME}</strong> и отправьте команду <code>/start</code>.</p>
              <p>3. Отправьте боту шестизначный код из CRM.</p>
              <p>4. После подтверждения бот привяжет ваш аккаунт и примет команду <code>/stats</code>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ToggleRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div>
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
      <label className={`relative inline-flex items-center ${disabled ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}>
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="h-6 w-11 rounded-full bg-surface-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-surface-container-lowest after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
      </label>
    </div>
  )
}
