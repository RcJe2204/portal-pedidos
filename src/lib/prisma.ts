import { PrismaClient } from '@prisma/client'

// 1. Definição do tipo para o objeto global
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 2. Instância do Prisma
// Ele prioriza a variável de ambiente da AWS Amplify. 
// Se não existir, ele falhará com um erro claro em vez de expor sua senha.
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// 3. Previne múltiplas instâncias em desenvolvimento
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma