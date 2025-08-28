import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.string().optional().default('4000'),
  CORS_ALLOWLIST: z.string().optional(), // comma-separated origins or '*'
  API_KEYS: z.string().optional(), // comma-separated keys
});

const parsed = EnvSchema.parse(process.env);

const corsAllowlistRaw = (parsed.CORS_ALLOWLIST ?? '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const apiKeysSet = new Set(
  (parsed.API_KEYS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

export const config = {
  port: Number(parsed.PORT),
  corsAllowlist: corsAllowlistRaw,
  apiKeys: apiKeysSet,
};


