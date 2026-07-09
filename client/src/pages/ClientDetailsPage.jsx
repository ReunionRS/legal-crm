import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppIcon } from '../components/AppIcon'
import { ClientAvatar } from '../components/ClientAvatar'
import { StatusBadge } from '../components/StatusBadge'
import { deleteClient, getClient } from '../lib/api'

export function ClientDetailsPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getClient(clientId)
      .then(setClient)
      .catch((nextError) => setError(nextError.message))
  }, [clientId])

  async function handleDelete() {
    const isConfirmed = window.confirm('Удалить этого клиента без возможности восстановления?')
    if (!isConfirmed) {
      return
    }

    try {
      await deleteClient(clientId)
      navigate('/clients')
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  if (error) {
    return <div className="fade-up rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
  }

  if (!client) {
    return <div className="fade-up text-sm text-on-surface-variant">Загрузка профиля клиента...</div>
  }

  return (
    <div className="fade-up">
      <nav className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/clients" className="transition hover:text-primary">
          Клиенты
        </Link>
        <AppIcon name="chevronRight" className="h-4 w-4" />
        <span className="font-semibold text-on-surface">{client.fullName}</span>
      </nav>

      <section className="card-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <ClientAvatar client={client} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{client.fullName}</h2>
                <StatusBadge status={client.status} />
              </div>
              <div className="mt-3 flex flex-col gap-2 text-sm text-on-surface-variant sm:flex-row sm:flex-wrap sm:gap-x-6">
                <span>{client.phone}</span>
                <span>Создан {new Date(client.createdAt).toLocaleDateString('ru-RU')}</span>
                <span>Обновлен {new Date(client.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to={`/clients/${client.id}/edit`}
              className="rounded-xl border border-outline-variant px-5 py-2.5 text-center font-semibold transition hover:bg-surface-container-low"
            >
              Редактировать
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-error px-5 py-2.5 font-semibold text-error transition hover:bg-error/5"
            >
              Удалить
            </button>
          </div>
        </div>
      </section>

      <section className="card-panel mt-8 p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">История активности</h3>
        </div>

        {(client.activities ?? []).length ? (
          <div className="space-y-4">
            {(client.activities ?? []).map((activity) => (
              <article key={activity.id} className="rounded-2xl border border-outline-variant bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold sm:text-base">{activity.title}</p>
                  <span className="text-xs text-on-surface-variant">
                    {new Date(activity.occurredAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">{activity.details}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">Активность по клиенту пока отсутствует.</p>
        )}
      </section>
    </div>
  )
}
