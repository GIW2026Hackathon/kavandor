import 'server-only';
import { z } from 'zod';

const serverEnvSchema = z.object({
  AI_PROVIDER_API_URL: z.string().url().default('https://api.openai.com/v1/chat/completions'),
  AI_PROVIDER_MODEL: z.string().min(1).default('gpt-4o-mini'),
  AI_PROVIDER_API_KEY: z.string().optional(),
});

export const serverEnv = serverEnvSchema.parse(process.env);
export const hasAiConfig = Boolean(serverEnv.AI_PROVIDER_API_KEY || process.env.GEMINI_API_KEY);
