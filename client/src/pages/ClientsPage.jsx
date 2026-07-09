import { useDeferredValue, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppIcon } from '../components/AppIcon'
import { ClientAvatar } from '../components/ClientAvatar'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { exportClientsToExcel } from '../lib/exportClients'
import { deleteClient, getClients, updateClient } from '../lib/api'

const STATUSES = ['Новый', 'В работе', 'Закрыт']

export function ClientsPage() {
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [error, setError] = useState('')
  const deferredQuery = useDeferredValue(query)

  async function loadClients() {
    try {
      setError('')
      setClients(await getClients())
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function handleDelete(clientId) {
    const isConfirmed = window.confirm('Удалить этого клиента без возможности восстановления?')
    if (!isConfirmed) {
      return
    }

    try {
      setError('')
      await deleteClient(clientId)
      await loadClients()
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  async function handleStatusChange(clientId, status) {
    try {
      setError('')
      setStatusUpdatingId(clientId)
      await updateClient(clientId, { status })
      await loadClients()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const normalizedQuery = deferredQuery.trim().toLowerCase()
  const filteredClients = clients.filter((client) => {
    const haystack = `${client.fullName} ${client.phone} ${client.status}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  function handleExport() {
    exportClientsToExcel(clients)
  }

  return (
    <div className="fade-up">
      <PageHeader
        title="Клиенты"
        description="Управляйте клиентской базой и отслеживайте статус обращений."
        actions={
          <>
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface-variant transition hover:bg-surface-container-high"
            >
              Экспорт
            </button>
            <Link
              to="/clients/new"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition hover:-translate-y-0.5"
            >
              Создать клиента
            </Link>
          </>
        }
      />

      {error ? <p className="mb-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}

      <section className="card-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-outline-variant p-6 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold">Список клиентов</h3>
          <div className="flex items-center gap-2">
            <label className="relative block w-full sm:w-80">
              <AppIcon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field h-11 bg-surface-container-low !pl-11 !pr-4"
                placeholder="Поиск по клиентам..."
                type="text"
              />
            </label>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-outline transition hover:bg-surface-container"
              aria-label="Фильтры"
            >
              <AppIcon name="filter" className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-outline transition hover:bg-surface-container"
              aria-label="Сортировка"
            >
              <AppIcon name="sort" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr>
                {['Клиент', 'Телефон', 'Статус', 'Обновлен', 'Действия'].map((head) => (
                  <th
                    key={head}
                    className="border-b border-outline-variant px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-outline"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="group transition hover:bg-surface-bright">
                  <td className="border-b border-outline-variant px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ClientAvatar client={client} />
                      <div>
                        <Link to={`/clients/${client.id}`} className="text-sm font-semibold text-on-surface">
                          {client.fullName}
                        </Link>
                        <p className="text-[11px] text-outline">ID: {client.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-outline-variant px-6 py-4 text-sm text-on-surface-variant">
                    {client.phone}
                  </td>
                  <td className="border-b border-outline-variant px-6 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                  <td className="border-b border-outline-variant px-6 py-4 text-sm text-on-surface-variant">
                    {new Date(client.updatedAt).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="border-b border-outline-variant px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={client.status}
                        onChange={(event) => handleStatusChange(client.id, event.target.value)}
                        disabled={statusUpdatingId === client.id}
                        className="h-10 min-w-[132px] rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-wait"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <Link
                        to={`/clients/${client.id}/edit`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-outline transition hover:bg-surface-container hover:text-primary"
                        aria-label="Редактировать клиента"
                      >
                        <AppIcon name="edit" className="h-5 w-5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(client.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-outline transition hover:bg-error/5 hover:text-error"
                        aria-label="Удалить клиента"
                      >
                        <AppIcon name="delete" className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredClients.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-on-surface-variant"
                  >
                    Клиенты по вашему запросу не найдены.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-bright px-6 py-4">
          <p className="text-[12px] font-medium text-outline">
            Показано <span className="text-on-surface">1 - {filteredClients.length}</span> из {clients.length} клиентов
          </p>
        </div>
      </section>
    </div>
  )
}
