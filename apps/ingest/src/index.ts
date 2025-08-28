import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { GraphQLClient, gql } from 'graphql-request';

dotenv.config({ path: '../../.env' });

const prisma = new PrismaClient();

async function main(): Promise<void> {
	console.log('Ingest service up');
	const count = await prisma.ensName.count();
	console.log(`ENS names in DB: ${count}`);

	const subgraphUrl = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
	try {
		const client = new GraphQLClient(subgraphUrl);
		const query = gql`
			query LatestRegistrations($first: Int!, $orderBy: Registration_orderBy!, $orderDirection: OrderDirection!) {
				registrations(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
					labelName
					registrant
					expiryDate
					registrationDate
				}
			}
		`;
		type GqlResp = {
			registrations: Array<{
				labelName?: string | null;
				registrant?: string | null;
				expiryDate?: string | number | null;
				registrationDate?: string | number | null;
			}>;
		};
		const data = await client.request<GqlResp>(query, { first: 5, orderBy: 'registrationDate', orderDirection: 'desc' });
		const items = data.registrations ?? [];
		let upserts = 0;
		for (const r of items) {
			const name = r.labelName ? `${r.labelName}.eth` : undefined;
			if (!name) continue;
			const registrationTime = r.registrationDate ? new Date(Number(r.registrationDate) * 1000) : new Date();
			const expiryTime = r.expiryDate ? new Date(Number(r.expiryDate) * 1000) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
			await prisma.ensName.upsert({
				where: { name },
				update: { registrant: r.registrant ?? '0x0', expirationDate: expiryTime },
				create: {
					name,
					labelHash: `seed-${name}`,
					registrant: r.registrant ?? '0x0',
					controller: r.registrant ?? '0x0',
					registrationDate: registrationTime,
					expirationDate: expiryTime,
				},
			});
			upserts += 1;
		}
		console.log(`ETL upserted ${upserts} registrations from subgraph.`);
	} catch (err) {
		console.warn('ETL fetch skipped or failed:', (err as Error).message);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

