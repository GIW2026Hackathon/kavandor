import { expect, test } from '@playwright/test';

function localDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('farmer finds, compares and requests a facility and transport quote', async ({ page }) => {
  const start = localDate(2);
  const submitted: Array<{ path: string; body: Record<string, unknown> }> = [];
  let facilityMockHit = false;
  await page.route('**/api/facilities**', async (route) => {
    facilityMockHit = true;
    await route.fulfill({
      json: {
        facilities: [{
          id: 'facility-123',
          name: 'Kisii Produce Cold Room',
          county: 'Kisii',
          location: 'Kisii Town',
          type: 'cold_storage',
          description: 'Provider-listed cold storage.',
          address: null,
          latitude: null,
          longitude: null,
          facilityType: 'cold_storage',
          acceptedCommodities: ['Tomato'],
          storageTypes: ['cold'],
          pricePerUnit: 3,
          priceUnit: 'kg',
          pricePeriod: 'day',
          minimumQuantity: null,
          capacityUnit: 'kg',
          conditionTargets: { temperature: '10–14 C' },
          verificationStatus: 'provider_reported',
          verifiedAt: null,
          isDemo: false,
          source: 'provider_reported',
          createdAt: new Date().toISOString(),
          availabilityUpdatedAt: null,
          availabilitySlots: [{
            id: 'slot-123',
            capacityKg: 500,
            reservedKg: 50,
            availableCapacityKg: 450,
            windowStart: new Date(`${localDate(1)}T00:00:00`).toISOString(),
            windowEnd: new Date(`${localDate(8)}T23:59:00`).toISOString(),
          }],
        }],
        source: 'database',
      },
    });
  });
  await page.route('**/api/harvests', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    submitted.push({ path: '/api/harvests', body: route.request().postDataJSON() as Record<string, unknown> });
    await route.fulfill({ status: 201, json: { harvest: { id: 'harvest-123' } } });
  });
  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    submitted.push({ path: '/api/reservations', body: route.request().postDataJSON() as Record<string, unknown> });
    await route.fulfill({ status: 201, json: { reservation: { id: 'reservation-123' } } });
  });
  await page.route('**/api/transport-jobs', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    submitted.push({ path: '/api/transport-jobs', body: route.request().postDataJSON() as Record<string, unknown> });
    await route.fulfill({ status: 201, json: { transportRequest: { id: 'transport-123', status: 'quote_pending' } } });
  });

  await page.goto('/storage');
  await expect(page.getByRole('heading', { name: 'Agri-Value Chain Facilities' })).toBeVisible();
  await expect.poll(() => facilityMockHit).toBe(true);
  await expect(page.getByRole('heading', { name: 'Kisii Produce Cold Room' })).toBeVisible();
  await page.getByLabel('Crop').fill('Tomatoes');
  await page.getByLabel('Quantity (kg)').fill('20');
  await page.getByLabel('Farm or collection point').fill('Nyakundi farm');
  await page.getByLabel('County').fill('Kisii');
  await page.getByLabel('Harvest date').fill(localDate(1));
  await page.getByLabel('Current condition').selectOption('Fresh and sound');
  await page.getByLabel('Preferred service start').fill(start);

  const facilityCard = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Kisii Produce Cold Room' }) });
  await expect(facilityCard).toContainText('Fits entered quantity and dates');
  await facilityCard.getByRole('button', { name: 'Compare' }).click();
  await expect(page.getByRole('heading', { name: 'What each option may help you achieve' })).toBeVisible();
  await expect(page.getByText('Cannot estimate — market price and full costs are missing')).toBeVisible();

  await facilityCard.getByRole('button', { name: 'Request availability & quote' }).click();
  const requestPanel = page.locator('#service-request');
  await requestPanel.locator('input[value="request_quote"]').check();
  await requestPanel.getByRole('button', { name: 'Request availability & quote' }).click();
  await expect(requestPanel.getByText('Request submitted · Pending provider review')).toBeVisible();
  await requestPanel.getByRole('button', { name: 'Request transport quote' }).click();
  await expect(requestPanel.getByText(/transport-123/)).toBeVisible();

  expect(submitted.map((request) => request.path)).toEqual([
    '/api/harvests',
    '/api/reservations',
    '/api/transport-jobs',
  ]);
  expect(submitted[0].body.crop).toBe('Tomato');
  expect(submitted[1].body.requestedQuantity).toBe(20);
  expect(submitted[2].body.harvestId).toBe('harvest-123');
});
