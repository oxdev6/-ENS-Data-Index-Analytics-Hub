import Fastify from 'fastify';
import mercurius from 'mercurius';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { config } from './config.js';
import { restRoutes } from './routes/rest.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const server = Fastify({ logger: true });
const prisma = new PrismaClient();

// Basic CORS and rate-limiting without plugins
const requestsByIp: Map<string, { count: number; windowStart: number }> = new Map();
const RATE_LIMIT = 100; // requests
const WINDOW_MS = 60_000; // 1 minute

server.addHook('onRequest', async (req, reply) => {
  // CORS headers
  const origin = req.headers.origin ?? '*';
  const allowed = config.corsAllowlist.includes('*') || config.corsAllowlist.includes(origin);
  reply.header('Access-Control-Allow-Origin', allowed ? origin : '');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    reply.code(204);
    return reply.send();
  }

  // Rate limiting (very simple, in-memory)
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const existing = requestsByIp.get(ip);
  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    requestsByIp.set(ip, { count: 1, windowStart: now });
  } else {
    existing.count += 1;
    if (existing.count > RATE_LIMIT) {
      return reply.code(429).send({ error: 'Too Many Requests' });
    }
  }

  // API key enforcement if configured
  if (config.apiKeys.size > 0) {
    const key = (req.headers['x-api-key'] as string) || '';
    if (!config.apiKeys.has(key)) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  }
});

server.register(mercurius, {
  schema: typeDefs,
  resolvers,
  graphiql: true,
});

server.get('/health', async (_req, reply) => {
  reply.header('Cache-Control', 'no-store');
  return { status: 'ok' };
});

server.register(restRoutes);

// Minimal OpenAPI JSON (REST only)
server.get('/openapi.json', async () => ({
  openapi: '3.0.0',
  info: { title: 'ENS Hub API', version: '0.1.0' },
  paths: {
    '/health': { get: { responses: { '200': { description: 'ok' } } } },
    '/registrations': { get: { parameters: [], responses: { '200': { description: 'List registrations' } } } },
    '/renewals': { get: { parameters: [], responses: { '200': { description: 'List renewals' } } } },
    '/names': { get: { parameters: [], responses: { '200': { description: 'List names' } } } },
    '/export/registrations.csv': { get: { responses: { '200': { description: 'CSV export' } } } },
    '/export/renewals.csv': { get: { responses: { '200': { description: 'CSV export' } } } },
    '/export/names.csv': { get: { responses: { '200': { description: 'CSV export' } } } },
  },
}));

// Simple Swagger UI using CDN
server.get('/docs', async (_req, reply) => {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ENS Hub API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });
    </script>
  </body>
  </html>`;
  reply.header('Content-Type', 'text/html');
  return reply.send(html);
});

// WebSocket support for real-time updates
server.register(require('@fastify/websocket'));

server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          connection.socket.send(JSON.stringify({
            type: 'subscribed',
            channel: data.channel || 'registrations'
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Send periodic updates (every 30 seconds)
    const interval = setInterval(async () => {
      try {
        const recentRegistrations = await prisma.registrationEvent.findMany({
          take: 5,
          orderBy: { blockTime: 'desc' }
        });
        
        connection.socket.send(JSON.stringify({
          type: 'update',
          data: {
            recentRegistrations: recentRegistrations.map(r => ({
              ...r,
              costEth: r.costEth.toString()
            }))
          }
        }));
      } catch (error) {
        console.error('WebSocket update error:', error);
      }
    }, 30000);

    connection.socket.on('close', () => {
      clearInterval(interval);
    });
  });
});

const port = Number(process.env.PORT || 4000);

server.setErrorHandler((err, _req, reply) => {
  const status = (err as any).statusCode || 500;
  reply.code(status).send({ error: err.message || 'Internal Server Error' });
});

server
  .listen({ port, host: '0.0.0.0' })
  .then((address) => {
    server.log.info(`API listening at ${address}`);
  })
  .catch((err) => {
    server.log.error(err);
    process.exit(1);
  });


