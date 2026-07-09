import 'dotenv/config'
import prismaPackage from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = prismaPackage
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.document.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.client.deleteMany()

  await prisma.client.create({
    data: {
      fullName: 'Alice Montgomery',
      phone: '+1 (555) 123-4567',
      email: 'alice@example.com',
      city: 'San Francisco, CA',
      matter: 'Real Estate Litigation',
      status: 'IN_PROGRESS',
      notes:
        'Client reviewed the proposed retainer agreement. Focused on the IP litigation strategy for the upcoming fiscal quarter.',
      address: '1200 California St, San Francisco',
      retainerBalance: '$12,450.00',
      hoursBilled: '42.5 hrs',
      lastPayment: new Date('2026-07-02T00:00:00.000Z'),
      activities: {
        create: [
          {
            title: 'Note added: Initial consultation complete',
            details:
              'Client reviewed the proposed retainer agreement. Next step: internal case review.',
            occurredAt: new Date('2026-07-08T14:15:00.000Z'),
          },
          {
            title: 'Status changed to In Progress',
            details: 'Transitioned from Lead to Active Client after deposit confirmation.',
            occurredAt: new Date('2026-07-05T09:45:00.000Z'),
          },
        ],
      },
      documents: {
        create: [
          { name: 'Retainer_Agreement_V2.pdf', size: '4.2 MB', updatedLabel: 'Updated 2 days ago' },
          { name: 'Initial_Case_Strategy.docx', size: '1.1 MB', updatedLabel: 'Updated 5 days ago' },
        ],
      },
    },
  })

  await prisma.client.createMany({
    data: [
      {
        fullName: 'Benjamin Harrison',
        phone: '+1 (555) 987-6543',
        email: 'benjamin@example.com',
        city: 'Chicago, IL',
        matter: 'Corporate Fraud Defense',
        status: 'IN_PROGRESS',
        notes: 'High-priority compliance review scheduled with internal audit team.',
      },
      {
        fullName: 'Catherine Kim',
        phone: '+1 (555) 444-2222',
        email: 'catherine@example.com',
        city: 'Seattle, WA',
        matter: 'Family Law / Mediation',
        status: 'CLOSED',
        notes: 'Final settlement package signed and archived.',
      },
      {
        fullName: 'David Sinclair',
        phone: '+1 (555) 888-0099',
        email: 'david@example.com',
        city: 'Austin, TX',
        matter: 'Intellectual Property',
        status: 'NEW',
        notes: 'Waiting for conflict check and initial documentation.',
      },
    ],
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
