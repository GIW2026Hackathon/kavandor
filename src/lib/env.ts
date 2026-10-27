import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  AI_PROVIDER_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export const hasSupabaseConfig = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const hasAiConfig = Boolean(
  env.AI_PROVIDER_API_KEY || env.GEMINI_API_KEY,
);

export const hasGoogleAuthConfig = Boolean(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
export const hasFacebookAuthConfig = Boolean(env.NEXT_PUBLIC_FACEBOOK_APP_ID);
export const hasSocialAuthConfig = hasGoogleAuthConfig || hasFacebookAuthConfig;
