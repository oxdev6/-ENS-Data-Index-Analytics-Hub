import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const now = new Date();
  await prisma.registrationEvent.createMany({
    data: [
      {
        name: 'alice.eth',
        txHash: '0xreg1',
        blockNumber: 1,
        blockTime: new Date(now.getTime() - 86400000),
        registrant: '0xabc',
        costEth: new Decimal('0.01'),
        chainId: 1,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.renewalEvent.createMany({
    data: [
      {
        name: 'alice.eth',
        txHash: '0xren1',
        blockNumber: 2,
        blockTime: new Date(now.getTime() - 43200000),
        payer: '0xabc',
        costEth: new Decimal('0.005'),
        years: 1,
        chainId: 1,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.ensName.upsert({
    where: { name: 'alice.eth' },
    update: {},
    create: {
      name: 'alice.eth',
      labelHash: '0xlabelhash',
      registrant: '0xabc',
      controller: '0xabc',
      registrationDate: new Date(now.getTime() - 172800000),
      expirationDate: new Date(now.getTime() + 31536000000),
    },
  });
  console.log('Seed complete');
}

main().finally(async () => {
  await prisma.$disconnect();
});


