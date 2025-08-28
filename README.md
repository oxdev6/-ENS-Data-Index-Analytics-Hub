## ENS Data Index & Analytics Hub

Open-source dashboard and API for transparent ENS adoption metrics across mainnet and L2s.

### Monorepo

- apps/api: REST + GraphQL API (Fastify + Mercurius)
- apps/ingest: ETL indexer pulling from The Graph/ethers
- apps/web: Dashboard (Next.js) with charts and exports
- packages/db: Prisma schema, migrations, and client

### Getting Started

1. Install Node.js >= 20
2. Copy `.env.example` to `.env` and set database URL
3. `npm install`
4. `docker compose up -d`
5. `npm run dev`

### License

Dual-licensed under MIT and Apache-2.0.

