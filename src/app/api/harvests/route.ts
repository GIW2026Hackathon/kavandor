import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  crop: z.string().min(2),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'crate', 'bucket', 'box']),
  harvestDate: z.string(),
  location: z.string().min(2),
  handlingNotes: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Harvest payload is invalid.' } },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: true, harvest: { ...parsed.data, id: 'demo-harvest-001', status: 'draft' } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Unable to parse harvest request.' } },
      { status: 400 },
    );
  }
}
