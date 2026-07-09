import prismaPackage from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const { PrismaClient } = prismaPackage
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
