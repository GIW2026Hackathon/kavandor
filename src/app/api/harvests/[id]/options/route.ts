import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    harvestId: 'demo-harvest-001',
    options: [
      {
        type: 'immediate_sale',
        label: 'Sell immediately',
        description: 'A ready-to-market lot with minimal handling.',
        estimatedNet: 9300,
        assumptions: ['Demo price assumptions only'],
        feasible: true,
      },
      {
        type: 'storage',
        label: 'Cold storage',
        description: 'Short-term storage to preserve freshness for 24-48 hours.',
        estimatedNet: 8200,
        assumptions: ['Demo storage quoted for planning only'],
        feasible: true,
      },
    ],
  });
}
