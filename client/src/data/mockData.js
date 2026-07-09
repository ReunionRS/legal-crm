export const mockClients = [
  {
    id: 1,
    fullName: 'Алиса Монтгомери',
    phone: '+1 (555) 123-4567',
    status: 'В работе',
    updatedAt: '2026-07-08T11:20:00.000Z',
    createdAt: '2026-07-01T10:20:00.000Z',
    activities: [
      {
        id: 1,
        title: 'Данные клиента обновлены',
        details: 'Статус изменен и карточка дополнена администратором.',
        occurredAt: '2026-07-08T14:15:00.000Z',
      },
      {
        id: 2,
        title: 'Создана карточка клиента',
        details: 'Клиент добавлен в систему.',
        occurredAt: '2026-07-01T11:20:00.000Z',
      },
    ],
  },
  {
    id: 2,
    fullName: 'Бенджамин Харрисон',
    phone: '+1 (555) 987-6543',
    status: 'В работе',
    updatedAt: '2026-07-07T09:10:00.000Z',
    createdAt: '2026-06-23T08:00:00.000Z',
    activities: [],
  },
  {
    id: 3,
    fullName: 'Кэтрин Ким',
    phone: '+1 (555) 444-2222',
    status: 'Закрыт',
    updatedAt: '2026-07-03T16:30:00.000Z',
    createdAt: '2026-05-18T10:00:00.000Z',
    activities: [],
  },
  {
    id: 4,
    fullName: 'Дэвид Синклер',
    phone: '+1 (555) 888-0099',
    status: 'Новый',
    updatedAt: '2026-07-09T08:45:00.000Z',
    createdAt: '2026-07-09T08:45:00.000Z',
    activities: [],
  },
]

export const mockSettings = {
  profile: {
    firmName: '',
    lawyerName: '',
    email: '',
    phone: '',
  },
  notifications: {
    telegram: false,
  },
}
