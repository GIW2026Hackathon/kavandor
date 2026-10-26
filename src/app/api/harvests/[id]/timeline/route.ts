import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timeline: [
      { type: 'created', label: 'Harvest logged', at: new Date().toISOString() },
      { type: 'assessed', label: 'Visible assessment completed', at: new Date().toISOString() },
    ],
  });
}
