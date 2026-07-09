import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppIcon } from '../components/AppIcon'
import { ClientForm } from '../components/ClientForm'
import { getClient, updateClient } from '../lib/api'

const emptyForm = {
  fullName: '',
  phone: '',
  status: 'Новый',
}

export function ClientEditPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getClient(clientId).then((client) => {
      if (client) {
        setForm({
          fullName: client.fullName ?? '',
          phone: client.phone ?? '',
          status: client.status ?? 'Новый',
        })
      }
      setLoading(false)
    })
  }, [clientId])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const updatedClient = await updateClient(clientId, form)
      navigate(`/clients/${updatedClient.id}`)
    } catch (nextError) {
      setError(nextError.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="fade-up text-sm text-on-surface-variant">Загрузка формы редактирования...</div>
  }

  return (
    <div className="fade-up">
      <div className="mb-8">
        <nav className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
          <Link to="/clients" className="transition hover:text-primary">
            Клиенты
          </Link>
          <AppIcon name="chevronRight" className="h-4 w-4" />
          <Link to={`/clients/${clientId}`} className="transition hover:text-primary">
            {form.fullName || 'Клиент'}
          </Link>
          <AppIcon name="chevronRight" className="h-4 w-4" />
          <span className="text-primary">Редактирование</span>
        </nav>
        <h2 className="text-3xl font-bold tracking-tight">Редактирование клиента</h2>
      </div>

      {error ? <p className="mb-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}

      <ClientForm
        form={form}
        setForm={setForm}
        title="Изменить карточку клиента"
        description="Обновите имя, телефон и статус клиента."
        submitLabel="Сохранить изменения"
        submitting={submitting}
        onSubmit={handleSubmit}
        cancelTo={`/clients/${clientId}`}
      />
    </div>
  )
}
