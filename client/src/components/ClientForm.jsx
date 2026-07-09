import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppIcon } from './AppIcon'

const STATUSES = ['Новый', 'В работе', 'Закрыт']
const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё\s'-]+$/

function normalizeName(value) {
  return value.replace(/\s{2,}/g, ' ').replace(/^\s+/, '')
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '')
  let localDigits = digits

  if (localDigits.startsWith('7') || localDigits.startsWith('8')) {
    localDigits = localDigits.slice(1)
  }

  localDigits = localDigits.slice(0, 10)

  let result = '+7'

  if (localDigits.length > 0) {
    result += ` (${localDigits.slice(0, 3)}`
  }

  if (localDigits.length >= 4) {
    result += `) ${localDigits.slice(3, 6)}`
  }

  if (localDigits.length >= 7) {
    result += `-${localDigits.slice(6, 8)}`
  }

  if (localDigits.length >= 9) {
    result += `-${localDigits.slice(8, 10)}`
  }

  return result
}

function getPhoneDigits(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('7') || digits.startsWith('8')) {
    return digits.slice(1, 11)
  }
  return digits.slice(0, 10)
}

function validateForm(form) {
  const errors = {}
  const fullName = form.fullName?.trim() ?? ''
  const phoneDigits = getPhoneDigits(form.phone?.trim() ?? '')

  if (fullName.length < 2) {
    errors.fullName = 'Имя клиента должно содержать минимум 2 символа.'
  } else if (fullName.length > 80) {
    errors.fullName = 'Имя клиента не должно быть длиннее 80 символов.'
  } else if (!NAME_PATTERN.test(fullName)) {
    errors.fullName = 'Используйте только буквы, пробелы, дефис или апостроф.'
  }

  if (phoneDigits.length !== 10) {
    errors.phone = 'Введите телефон в формате +7 (999) 999-99-99.'
  }

  return errors
}

export function ClientForm({
  form,
  setForm,
  title,
  description,
  submitLabel,
  submitting,
  onSubmit,
  cancelTo = '/clients',
}) {
  const [errors, setErrors] = useState({})

  function updateField(name, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors
      }

      const nextErrors = { ...currentErrors }
      delete nextErrors[name]
      return nextErrors
    })
  }

  function handleSubmit(event) {
    const nextErrors = validateForm(form)

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault()
      setErrors(nextErrors)
      return
    }

    onSubmit(event)
  }

  return (
    <section className="card-panel overflow-hidden">
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <AppIcon name="personAdd" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-sm text-on-surface-variant">{description}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-on-surface">Имя клиента</span>
              <input
                required
                minLength={2}
                maxLength={80}
                value={form.fullName ?? ''}
                onChange={(event) => updateField('fullName', normalizeName(event.target.value))}
                className={`field ${errors.fullName ? 'border-error focus:border-error focus:ring-error/15' : ''}`}
                placeholder="Например, Иван Петров"
                type="text"
              />
              {errors.fullName ? <p className="mt-2 text-sm text-error">{errors.fullName}</p> : null}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-on-surface">Телефон</span>
              <input
                required
                value={form.phone ?? '+7'}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                className={`field ${errors.phone ? 'border-error focus:border-error focus:ring-error/15' : ''}`}
                placeholder="+7 (999) 999-99-99"
                inputMode="tel"
                type="tel"
              />
              {errors.phone ? <p className="mt-2 text-sm text-error">{errors.phone}</p> : null}
            </label>

            <label>
              <span className="mb-2 block text-sm font-medium text-on-surface">Статус дела</span>
              <select
                value={form.status ?? 'Новый'}
                onChange={(event) => updateField('status', event.target.value)}
                className="field"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low px-8 py-6">
          <Link to={cancelTo} className="text-sm font-medium text-on-surface-variant transition hover:text-on-surface">
            Отмена
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            <AppIcon name="checkCircle" className="h-[18px] w-[18px]" />
            {submitting ? 'Сохранение...' : submitLabel}
          </button>
        </div>
      </form>
    </section>
  )
}
