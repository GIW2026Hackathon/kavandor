import { NextResponse } from 'next/server';
import { hasSupabaseConfig } from '@/lib/env';
import { createSupabasePublicClient } from '@/lib/supabase-server';

export async function GET() {
  if (!hasSupabaseConfig) {
    return NextResponse.json({
      ok: false,
      app: 'kavandor',
      status: 'not_configured',
      dependencies: { database: false },
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

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

  return NextResponse.json({
    ok: true,
    app: 'kavandor',
    status: 'ready',
    dependencies: { database: true },
  }, { headers: { 'Cache-Control': 'no-store' } });
}
