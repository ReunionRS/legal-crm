import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppIcon } from '../components/AppIcon'
import { ClientForm } from '../components/ClientForm'
import { createClient } from '../lib/api'

const initialState = {
  fullName: '',
  phone: '',
  status: 'Новый',
}

export function ClientCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const createdClient = await createClient(form)
      navigate(`/clients/${createdClient.id}`)
    } catch (nextError) {
      setError(nextError.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fade-up">
      <div className="mb-8">
        <nav className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">
          <Link to="/clients" className="transition hover:text-primary">
            Клиенты
          </Link>
          <AppIcon name="chevronRight" className="h-4 w-4" />
          <span className="text-primary">Новый клиент</span>
        </nav>
        <h2 className="text-3xl font-bold tracking-tight">Добавление клиента</h2>
      </div>

      {error ? <p className="mb-6 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}

      <ClientForm
        form={form}
        setForm={setForm}
        title="Добавить клиента"
        description="После сохранения карточка будет создана в Firestore."
        submitLabel="Сохранить клиента"
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
