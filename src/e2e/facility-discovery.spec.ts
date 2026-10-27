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
    if (route.request().method() === 'GET') {
      await route.fulfill({
        json: {
          reservations: [{
            id: 'reservation-123',
            quantity_kg: 20,
            quantity_unit: 'kg',
            status: 'pending',
            requested_start_at: new Date(`${start}T08:00:00`).toISOString(),
            expected_end_at: new Date(`${start}T08:00:00`).toISOString(),
            created_at: new Date().toISOString(),
            source: 'provider_reported',
            facilities: { name: 'Kisii Produce Cold Room', county: 'Kisii', location: 'Kisii Town' },
            harvests: { crop: 'Tomato', quantity: 20, unit: 'kg', harvest_date: localDate(1) },
          }],
        },
      });
      return;
    }
    if (route.request().method() !== 'POST') return route.continue();
    submitted.push({ path: '/api/reservations', body: route.request().postDataJSON() as Record<string, unknown> });
    await route.fulfill({ status: 201, json: { reservation: { id: 'reservation-123' } } });
  });
  await page.route('**/api/inventory-batches', async (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    await route.fulfill({
      json: {
        inventoryBatches: [{
          id: 'batch-123',
          harvest_id: 'harvest-123',
          facility_id: 'facility-123',
          reservation_id: 'reservation-123',
          actual_received_kg: 19.5,
          discrepancy_kg: 0.5,
          status: 'received',
          received_at: new Date().toISOString(),
          harvests: { crop: 'Tomato', quantity: 20, unit: 'kg', farmer_id: 'farmer-123' },
          facilities: { name: 'Kisii Produce Cold Room', location: 'Kisii Town', county: 'Kisii' },
        }],
      },
    });
  });
  await page.route('**/api/notifications', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({ json: { notifications: [] } });
      return;
    }
    await route.fulfill({
      json: {
        notifications: [{
          id: 'notice-123',
          event_type: 'reservation_pending',
          message: 'Your facility request is awaiting provider review.',
          resource_type: 'reservation',
          resource_id: 'reservation-123',
          read_at: null,
          created_at: new Date().toISOString(),
        }],
      },
    });
  });
  await page.route('**/api/transport-jobs', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    submitted.push({ path: '/api/transport-jobs', body: route.request().postDataJSON() as Record<string, unknown> });
    await route.fulfill({ status: 201, json: { transportRequest: { id: 'transport-123', status: 'quote_pending' } } });
  });

  await page.goto('/storage');
  await expect(page.getByRole('heading', { name: 'Agri-Value Chain Facilities' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Farmer Workspace navigation' }).getByRole('link', { name: 'Facility requests' })).toHaveCount(0);
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

  await facilityCard.getByRole('button', { name: 'Review facility' }).click();
  await expect(page).toHaveURL(/\/storage$/);
  await expect(page.getByRole('heading', { name: 'What will I gain?' })).toBeVisible();
  const requestPanel = page.locator('#facility-request');
  await expect(requestPanel.getByRole('heading', { name: 'Request this facility service' })).toBeVisible();
  await requestPanel.locator('input[value="request_quote"]').check();
  await requestPanel.getByRole('button', { name: 'Request availability & quote' }).click();
  await expect(requestPanel.getByText('Request submitted · Pending provider review')).toBeVisible();
  await requestPanel.getByRole('button', { name: 'Request transport quote' }).click();
  await expect(requestPanel.getByText(/transport-123/)).toBeVisible();

  await page.getByRole('tab', { name: 'Facility requests' }).click();
  await expect(page.getByRole('heading', { name: 'Tomato · 20 kg' })).toBeVisible();
  await page.getByRole('tab', { name: 'My stored produce' }).click();
  await expect(page.getByRole('heading', { name: 'Tomato · 19.5 kg' })).toBeVisible();
  await page.getByRole('tab', { name: 'Storage alerts' }).click();
  await expect(page.getByText('Your facility request is awaiting provider review.')).toBeVisible();
  await page.goto('/storage?section=alerts');
  await expect(page.getByRole('tab', { name: 'Storage alerts' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Your facility request is awaiting provider review.')).toBeVisible();

  expect(submitted.map((request) => request.path)).toEqual([
    '/api/harvests',
    '/api/reservations',
    '/api/transport-jobs',
  ]);
  expect(submitted[0].body.crop).toBe('Tomato');
  expect(submitted[1].body.requestedQuantity).toBe(20);
  expect(submitted[2].body.harvestId).toBe('harvest-123');
});
