import { expect, test } from '@playwright/test'

test('hazard share edit clears the stale flag and review filters move the totals', async ({ page }) => {
  await page.goto('/report')
  await page.getByLabel('Apa yang Anda lihat?').fill('A leaking battery is beside the public path.')
  await page.getByRole('button', { name: 'Klasifikasi' }).click()
  await expect(page.getByText('Classifier flags: hazardous_present, no_image')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Sertakan hazardous_present pada klasifikasi terkonfirmasi' })).toBeChecked()

  await page.getByLabel('hazardous %').fill('0')
  await page.getByLabel('plastic %').fill('100')
  await expect(page.getByRole('checkbox', { name: 'Sertakan hazardous_present pada klasifikasi terkonfirmasi' })).not.toBeChecked()
  await expect(page.getByText('Bendera terkonfirmasi: no_image')).toBeVisible()
  await expect(page.getByText('Hazard cleared by resident, needs check')).toBeVisible()

  await page.getByLabel('Lintang (Latitude)').fill('-8.670000')
  await page.getByLabel('Bujur (Longitude)').fill('115.210000')
  await page.getByRole('checkbox', { name: 'Saya telah meninjau hasil ini' }).check()

  const posted = page.waitForResponse((response) => response.url().endsWith('/api/reports') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Kirim laporan' }).click()
  const response = await posted
  const request = response.request()
  const body = JSON.parse(request.postData() ?? '{}') as {
    clientRequestId?: string
    classification: { flags: string[]; types: Array<{ type: string; share: number }> }
    aiClassification: { flags: string[]; types: Array<{ type: string; share: number }>; rationale?: string }
  }
  const saved = (await response.json()) as {
    data: {
      classification: { flags: string[]; reviewReasons: string[]; needsReview: boolean }
      aiClassification?: { flags: string[]; types: Array<{ type: string; share: number }>; rationale?: string }
    }
  }
  expect(response.ok()).toBeTruthy()
  expect(request.headers()['idempotency-key']).toBeTruthy()
  expect(body.clientRequestId).toBe(request.headers()['idempotency-key'])
  expect(body.classification.flags).not.toContain('hazardous_present')
  expect(body.classification.types).toEqual([{ type: 'plastic', share: 1 }])
  expect(body.aiClassification.flags).toContain('hazardous_present')
  expect(body.aiClassification.types[0]).toMatchObject({ type: 'hazardous', share: 1 })
  expect(saved.data.classification.flags).not.toContain('hazardous_present')
  expect(saved.data.classification.reviewReasons).toEqual(['hazard_cleared_by_resident'])
  expect(saved.data.classification.needsReview).toBe(true)
  expect(saved.data.aiClassification?.flags).toContain('hazardous_present')
  expect(saved.data.aiClassification?.types[0]).toMatchObject({ type: 'hazardous', share: 1 })
  expect(saved.data.aiClassification?.rationale).toBe(body.aiClassification.rationale)
  await expect(page.getByRole('heading', { name: 'Laporan terkirim' })).toBeVisible()
  await expect(page.getByText('Not demo data')).toHaveCount(0)

  await page.goto('/dashboard')
  await expect(page.getByTestId('reported-litres')).toBeVisible()
  await page.locator('.leaflet-interactive').first().waitFor()
  const readLitres = async (testId: string) => (await page.getByTestId(testId).innerText()).replace(/\s+/g, ' ').trim()
  const readKecamatan = async () => (await page.getByRole('region', { name: 'Per kecamatan' }).innerText()).replace(/\s+/g, ' ').trim()
  const allLitres = await readLitres('reported-litres')
  const allPlastic = await readLitres('litres-plastic')
  const allKecamatan = await readKecamatan()
  const allMarkers = await page.locator('.leaflet-interactive').count()
  await page.getByRole('checkbox', { name: 'Perlu tinjauan' }).check()
  await expect(page.getByText('Bukan total seluruh kota tanpa filter')).toBeVisible()
  expect(await readLitres('reported-litres')).not.toBe(allLitres)
  expect(await readLitres('litres-plastic')).not.toBe(allPlastic)
  expect(await readKecamatan()).not.toBe(allKecamatan)
  const filteredMarkers = await page.locator('.leaflet-interactive').count()
  expect(filteredMarkers).toBeGreaterThan(0)
  expect(filteredMarkers).not.toBe(allMarkers)
  await page.locator('#filter-kecamatan').selectOption('Denpasar Utara')
  await expect(page.locator('.leaflet-container')).toBeVisible()
})
