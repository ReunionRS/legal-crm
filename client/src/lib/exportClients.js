import { utils, writeFileXLSX } from 'xlsx'

function formatDate(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function exportClientsToExcel(clients) {
  const exportRows = clients.map((client, index) => ({
    '№': index + 1,
    'ID клиента': client.id,
    'Имя клиента': client.fullName,
    Телефон: client.phone,
    'Статус дела': client.status,
    Обновлен: formatDate(client.updatedAt),
    Создан: formatDate(client.createdAt),
  }))

  const worksheet = utils.json_to_sheet(exportRows.length ? exportRows : [{ Сообщение: 'Нет данных для экспорта' }])
  const workbook = utils.book_new()

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
  ]

  utils.book_append_sheet(workbook, worksheet, 'Клиенты')

  const timestamp = new Date().toISOString().slice(0, 10)
  writeFileXLSX(workbook, `legal-crm-clients-${timestamp}.xlsx`)
}
