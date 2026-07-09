import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { demoClients, demoSettings } from './demoData.js'
import { formatClient, toDbStatus } from './formatters.js'
import { prisma } from './prisma.js'
import { getTelegramBridgeStatus, startTelegramBridge } from './telegramBridge.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

async function withFallback(getData, fallbackData) {
  try {
    return await getData()
  } catch {
    return fallbackData
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, date: new Date().toISOString() })
})

app.get('/api/integrations/telegram/status', (_request, response) => {
  response.json(getTelegramBridgeStatus())
})

app.get('/api/dashboard', async (_request, response) => {
  const dashboard = await withFallback(async () => {
    const [totalClients, activeClients, closedClients, newClients, activities] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.client.count({ where: { status: 'CLOSED' } }),
      prisma.client.count({ where: { status: 'NEW' } }),
      prisma.activity.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 4,
        include: { client: true },
      }),
    ])

    return {
      stats: [
        { label: 'Total Clients', value: totalClients.toString(), meta: 'Total', icon: 'group', tone: 'primary' },
        { label: 'New Inquiries', value: newClients.toString(), meta: 'Live', icon: 'inbox', tone: 'blue' },
        { label: 'Active Litigation', value: activeClients.toString(), meta: 'Active', icon: 'gavel', tone: 'orange' },
        { label: 'Cases Resolved', value: closedClients.toString(), meta: 'Closed', icon: 'check_circle', tone: 'green' },
        {
          label: 'Closed Cases Rate',
          value: totalClients ? `${Math.round((closedClients / totalClients) * 100)}%` : '0%',
          meta: 'Pipeline',
          icon: 'analytics',
          tone: 'slate',
          progress: totalClients ? Math.round((closedClients / totalClients) * 100) : 0,
        },
      ],
      recentActivities: activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        subtitle: activity.client.fullName,
        time: new Date(activity.occurredAt).toLocaleString('en-US'),
        icon: 'history',
      })),
      tasks: [
        { id: 1, title: 'Call client (John Doe)', subtitle: 'Due today at 2:00 PM' },
        { id: 2, title: 'Prepare documents for hearing', subtitle: 'High Priority • Due in 2 days' },
        { id: 3, title: 'Court meeting tomorrow', subtitle: '9:00 AM @ Superior Court Room 4B' },
        { id: 4, title: 'Review billing statements', subtitle: 'End of week wrap-up' },
      ],
    }
  }, {
    stats: [
      { label: 'Total Clients', value: '1,284', meta: 'Total', icon: 'group', tone: 'primary' },
      { label: 'New Inquiries', value: '156', meta: '+12%', icon: 'inbox', tone: 'blue' },
      { label: 'Active Litigation', value: '842', meta: 'Active', icon: 'gavel', tone: 'orange' },
      { label: 'Cases Resolved', value: '286', meta: 'Closed', icon: 'check_circle', tone: 'green' },
      { label: 'Closed Cases Rate', value: '74%', meta: 'Pipeline', icon: 'analytics', tone: 'slate', progress: 74 },
    ],
    recentActivities: [
      { id: 1, title: 'John Smith moved to In Progress', subtitle: 'Case ID: #L-2024-081', time: '2 hours ago', icon: 'sync_alt' },
      { id: 2, title: 'Sarah Johnson added as a new client', subtitle: 'Added by Paralegal Team', time: '5 hours ago', icon: 'person_add' },
      { id: 3, title: 'Michael Brown case closed and archived', subtitle: 'Final settlement processed', time: 'Yesterday at 4:30 PM', icon: 'done_all' },
      { id: 4, title: 'Document Affidavit_Final_v2.pdf uploaded', subtitle: 'Case: Doe vs Global Corp', time: 'Jan 24, 10:15 AM', icon: 'attachment' },
    ],
    tasks: [
      { id: 1, title: 'Call client (John Doe)', subtitle: 'Due today at 2:00 PM' },
      { id: 2, title: 'Prepare documents for hearing', subtitle: 'High Priority • Due in 2 days' },
      { id: 3, title: 'Court meeting tomorrow', subtitle: '9:00 AM @ Superior Court Room 4B' },
      { id: 4, title: 'Review billing statements', subtitle: 'End of week wrap-up' },
    ],
  })

  response.json(dashboard)
})

app.get('/api/clients', async (_request, response) => {
  const clients = await withFallback(
    async () =>
      (await prisma.client.findMany({ orderBy: { updatedAt: 'desc' } })).map((client) => formatClient(client)),
    demoClients,
  )

  response.json(clients)
})

app.get('/api/clients/:id', async (request, response) => {
  const clientId = Number(request.params.id)

  const client = await withFallback(
    async () => {
      const result = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          activities: { orderBy: { occurredAt: 'desc' } },
          documents: true,
        },
      })

      return result ? formatClient(result) : null
    },
    demoClients.find((item) => item.id === clientId) ?? null,
  )

  if (!client) {
    response.status(404).json({ message: 'Client not found' })
    return
  }

  response.json(client)
})

app.post('/api/clients', async (request, response) => {
  const payload = request.body

  const createdClient = await withFallback(
    async () => {
      const result = await prisma.client.create({
        data: {
          fullName: payload.fullName,
          phone: payload.phone,
          email: payload.email || null,
          city: payload.city || null,
          matter: payload.matter || null,
          notes: payload.notes || null,
          address: payload.city || null,
          status: toDbStatus(payload.status),
        },
      })

      return formatClient(result)
    },
    {
      id: Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [],
      documents: [],
    },
  )

  response.status(201).json(createdClient)
})

app.get('/api/settings', async (_request, response) => {
  response.json(demoSettings)
})

const server = app.listen(port, async () => {
  console.log(`Legal CRM API listening on http://localhost:${port}`)

  try {
    await startTelegramBridge()
  } catch (error) {
    console.error('Telegram bridge failed to start:', error.message)
  }
})

server.on('error', (error) => {
  console.error('Legal CRM API failed to start:', error.message)
  process.exit(1)
})
