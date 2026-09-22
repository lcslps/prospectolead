import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  GOOGLE_MAPS_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_AUX_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-3.5-flash-lite'),
  GEMINI_THINKING_LEVEL: z.enum(['low', 'medium', 'high']).default('low'),
  MAX_RETRIES: z.coerce.number().int().min(0).max(6).default(2),
  MAX_CONCURRENT_GENERATIONS: z.coerce.number().int().min(1).max(10).default(1),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(15000).max(180000).default(90000),
  PEXELS_API_KEY: z.string().default(''),
  PIXABAY_API_KEY: z.string().default(''),
  UNSPLASH_ACCESS_KEY: z.string().default(''),
  FACEBOOK_ACCESS_TOKEN: z.string().default(''),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().default(''),
  MAX_SITE_REFINEMENT_ITERATIONS: z.coerce.number().int().min(0).max(3).default(2),
  MAX_VISUAL_REFINEMENT_PASSES: z.coerce.number().int().min(0).max(3).default(2),
  VISUAL_QA_ENABLED: z.string().default('true').transform(value => !['false', '0', 'off', 'no'].includes(value.toLowerCase())),
  VISUAL_CRITIC_ENABLED: z.string().default('false').transform(value => ['true', '1', 'on', 'yes'].includes(value.toLowerCase())),
  VISUAL_QA_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120000).default(45000),
  GEMINI_OVERLOAD_RETRY_MS: z.coerce.number().int().min(15000).max(600000).default(60000),
  MAX_DEFERRED_GENERATION_RETRIES: z.coerce.number().int().min(0).max(12).default(3),
  GEMINI_SEND_IMAGES: z.string().default('true').transform(value => !['false', '0', 'off', 'no'].includes(value.toLowerCase())),
  // Public origin used by generated Google Places image proxy URLs. In production
  // this can be the API host; otherwise FRONTEND_URL is used when it proxies /api.
  PUBLIC_API_URL: z.string().default(''),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Configuração de ambiente inválida:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const hasGoogleKey = env.GOOGLE_MAPS_API_KEY.length > 0;
