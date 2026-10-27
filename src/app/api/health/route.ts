import { NextResponse } from 'next/server';
import { hasAiConfig, hasSupabaseConfig } from '@/lib/env';
import { createSupabasePublicClient } from '@/lib/supabase-server';

export async function GET() {
  if (!hasSupabaseConfig) {
    return NextResponse.json({
      ok: false,
      app: 'kavandor',
      status: 'not_configured',
      dependencies: { database: false },
      supabaseConfigured: false,
      aiProvider: hasAiConfig ? 'gemini-1.5-flash' : 'deterministic-fallback',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const supabase = createSupabasePublicClient();
    const { error } = await supabase.from('facilities').select('id').limit(1);
    if (error) {
      console.error('Health database probe failed:', error.code);
      return NextResponse.json({
        ok: false,
        app: 'kavandor',
        status: 'dependency_unavailable',
        dependencies: { database: false },
      }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  } catch (err) {
    console.error('Health check exception:', err);
    return NextResponse.json({
      ok: false,
      app: 'kavandor',
      status: 'dependency_unavailable',
      dependencies: { database: false },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  return NextResponse.json({
    ok: true,
    app: 'kavandor',
    status: 'ready',
    dependencies: { database: true },
    supabaseConfigured: true,
    aiProvider: hasAiConfig ? 'gemini-1.5-flash' : 'deterministic-fallback',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
