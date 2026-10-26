import { NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/database-adapter';
import { hasAiConfig, hasSupabaseConfig } from '@/lib/env';

export async function GET() {
  const db = getDatabaseAdapter();

  return NextResponse.json({
    ok: true,
    app: 'kavandor',
    status: 'ready',
    environment: process.env.NODE_ENV || 'development',
    databaseMode: db.mode,
    supabaseConfigured: hasSupabaseConfig,
    aiProvider: hasAiConfig ? 'gemini-1.5-flash' : 'deterministic-fallback',
    orchestratorServices: 13,
    timestamp: new Date().toISOString(),
  });
}
