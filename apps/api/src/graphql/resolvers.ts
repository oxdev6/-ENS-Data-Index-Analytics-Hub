import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resolvers = {
  Query: {
    health: () => 'ok',
    registrations: async (_: unknown, args: { limit?: number; offset?: number }) => {
      const { limit = 50, offset = 0 } = args;
      return prisma.registrationEvent.findMany({
        orderBy: { blockTime: 'desc' },
        take: limit,
        skip: offset,
      });
    },
    renewals: async (_: unknown, args: { limit?: number; offset?: number }) => {
      const { limit = 50, offset = 0 } = args;
      return prisma.renewalEvent.findMany({
        orderBy: { blockTime: 'desc' },
        take: limit,
        skip: offset,
      });
    },
    names: async (_: unknown, args: { search?: string; limit?: number; offset?: number }) => {
      const { search, limit = 50, offset = 0 } = args;
      return prisma.ensName.findMany({
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { registrant: { equals: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { registrationDate: 'desc' },
        take: limit,
        skip: offset,
      });
    },
  },
};


