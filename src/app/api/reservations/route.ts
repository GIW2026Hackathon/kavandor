import { NextResponse } from 'next/server';
import { demoFacilities } from '@/demo/storage';
import { storageRequestSchema } from '@/validations/storage';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = storageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Storage request is invalid.', issues: parsed.error.flatten() } }, { status: 400 });
  }

  const facility = demoFacilities.find((item) => item.id === parsed.data.facilityId);
  if (!facility) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Facility was not found.' } }, { status: 404 });
  if (parsed.data.quantityUnit !== 'kg') {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Capacity compatibility requires kilograms for this demo.' } }, { status: 400 });
  }
  if (parsed.data.requestedQuantity > 220) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Requested quantity exceeds the available 220 kg demo harvest.' } }, { status: 400 });
  }
  if (parsed.data.requestedQuantity > facility.availableCapacityKg) {
    return NextResponse.json({ error: { code: 'CAPACITY_EXCEEDED', message: 'Requested quantity exceeds confirmed available capacity.' } }, { status: 409 });
  }

  const storageCharge = parsed.data.requestedQuantity * facility.pricePerUnit;
  return NextResponse.json({
    ok: true,
    reservation: {
      id: 'storage-request-001',
      ...parsed.data,
      status: 'submitted',
      estimatedStorageCost: storageCharge,
      source: 'demo_data',
    },
  }, { status: 201 });
}
