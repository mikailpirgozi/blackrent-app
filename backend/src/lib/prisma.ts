/**
 * Prisma Client Singleton
 * Zabezpečuje že existuje len jedna inštancia Prisma Client v aplikácii
 */

import { PrismaClient } from '../generated/prisma';

// Rozšírený typ pre globálny objekt
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Singleton pattern pre Prisma Client
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

