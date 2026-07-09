import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../lib/firebase'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState(import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@legalcrm.local')
  const [password, setPassword] = useState(import.meta.env.VITE_ADMIN_PASSWORD ?? 'Admin12345!')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const from = location.state?.from?.pathname ?? '/dashboard'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (nextError) {
      setError(nextError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-outline-variant bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-primary px-10 py-12 text-on-primary lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_35%)]" />
          <div className="relative z-10">
            <p className="text-[12px] font-bold uppercase tracking-[0.24em] opacity-80">Доступ администратора</p>
            <h1 className="mt-4 max-w-md text-5xl font-bold leading-tight">
              Управление клиентами, документами и заявками в одном кабинете.
            </h1>
          </div>
        </section>

        <section className="bg-white px-6 py-8 sm:px-10 sm:py-12" style={{ color: '#111111' }}>
          <div className="mb-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em]" style={{ color: '#111111' }}>
              Юр CRM
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight" style={{ color: '#111111' }}>
              Вход администратора
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#111111' }}>
              {isFirebaseConfigured
                ? 'Используйте учётную запись администратора, созданную в Firebase Authentication.'
                : 'Ключи Firebase пока не настроены, поэтому включён локальный резервный вход.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: '#111111' }}>
                Электронная почта
              </span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="field" type="email" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium" style={{ color: '#111111' }}>
                Пароль
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field"
                type="password"
              />
            </label>

            {error ? <p className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? 'Выполняется вход...' : 'Войти'}
            </button>
          </form>

          {!isFirebaseConfigured ? (
            <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
              <p className="font-semibold text-on-surface">Локальные резервные данные</p>
              <p className="mt-2">Почта: {import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@legalcrm.local'}</p>
              <p>Пароль: {import.meta.env.VITE_ADMIN_PASSWORD ?? 'Admin12345!'}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
