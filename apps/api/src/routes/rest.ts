import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { toCsv, toCsvStream } from '../utils/csv.js';

const prisma = new PrismaClient();

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  chainId: z.coerce.number().int().optional(),
});

export async function restRoutes(app: FastifyInstance): Promise<void> {

  app.get('/registrations', async (req, reply) => {
    const { limit, offset, from, to, chainId } = paginationSchema.parse(req.query);
    const rows = await prisma.registrationEvent.findMany({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
      orderBy: { blockTime: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await prisma.registrationEvent.count({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
    });
    return {
      data: rows.map((r) => ({ ...r, costEth: r.costEth.toString() })),
      pagination: { limit, offset, total }
    };
  });

  app.get('/renewals', async (req, reply) => {
    const { limit, offset, from, to, chainId } = paginationSchema.parse(req.query);
    const rows = await prisma.renewalEvent.findMany({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
      orderBy: { blockTime: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await prisma.renewalEvent.count({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
    });
    return {
      data: rows.map((r) => ({ ...r, costEth: r.costEth.toString() })),
      pagination: { limit, offset, total }
    };
  });

  app.get('/names', async (req, reply) => {
    const schema = paginationSchema.extend({ search: z.string().optional() });
    const { limit, offset, search, from, to } = schema.parse(req.query);
    const rows = await prisma.ensName.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { registrant: { equals: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(from || to ? { registrationDate: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
      },
      orderBy: { registrationDate: 'desc' },
      take: limit,
      skip: offset,
    });
    const total = await prisma.ensName.count({
      where: {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { registrant: { equals: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(from || to ? { registrationDate: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
      },
    });
    return { data: rows, pagination: { limit, offset, total } };
  });

  app.get('/export/registrations.csv', async (req, reply) => {
    const { limit, offset, from, to, chainId } = paginationSchema.parse(req.query);
    const rows = await prisma.registrationEvent.findMany({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
      orderBy: { blockTime: 'desc' },
      take: limit,
      skip: offset,
    });
    const shaped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      txHash: r.txHash,
      blockNumber: r.blockNumber,
      blockTime: r.blockTime.toISOString(),
      registrant: r.registrant,
      costEth: r.costEth.toString(),
      chainId: r.chainId,
      createdAt: r.createdAt.toISOString(),
    }));
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="registrations.csv"');
    for (const chunk of toCsvStream(shaped)) {
      reply.raw.write(chunk);
    }
    reply.raw.end();
    return reply;
  });

  app.get('/export/renewals.csv', async (req, reply) => {
    const { limit, offset, from, to, chainId } = paginationSchema.parse(req.query);
    const rows = await prisma.renewalEvent.findMany({
      where: {
        ...(from || to ? { blockTime: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } } : {}),
        ...(chainId ? { chainId } : {}),
      },
      orderBy: { blockTime: 'desc' },
      take: limit,
      skip: offset,
    });
    const shaped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      txHash: r.txHash,
      blockNumber: r.blockNumber,
      blockTime: r.blockTime.toISOString(),
      payer: r.payer,
      costEth: r.costEth.toString(),
      years: r.years,
      chainId: r.chainId,
      createdAt: r.createdAt.toISOString(),
    }));
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="renewals.csv"');
    for (const chunk of toCsvStream(shaped)) {
      reply.raw.write(chunk);
    }
    reply.raw.end();
    return reply;
  });

  app.get('/export/names.csv', async (req, reply) => {
    const { limit, offset } = paginationSchema.parse(req.query);
    const rows = await prisma.ensName.findMany({
      orderBy: { registrationDate: 'desc' },
      take: limit,
      skip: offset,
    });
    const shaped = rows.map((r) => ({
      id: r.id,
      name: r.name,
      labelHash: r.labelHash,
      registrant: r.registrant,
      controller: r.controller ?? '',
      registrationDate: r.registrationDate.toISOString(),
      expirationDate: r.expirationDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="names.csv"');
    for (const chunk of toCsvStream(shaped)) {
      reply.raw.write(chunk);
    }
    reply.raw.end();
    return reply;
  });
}


