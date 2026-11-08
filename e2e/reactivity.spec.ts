import { expect, test, type Page } from '@playwright/test'

async function signInOfficer(page: Page) {
  const response = await page.request.post('/api/accounts', {
    data: {
      action: 'login',
      login: { email: 'surya.wirawan@dlhk.denpasar.id', password: process.env.DEMO_PETUGAS_PASSWORD },
    },
  })
  expect(response.ok()).toBeTruthy()
  const token = /cta_session=([^;]+)/.exec(response.headers()['set-cookie'] ?? '')?.[1]
  expect(token).toBeTruthy()
  await page.context().addCookies([
    {
      name: 'cta_session',
      value: decodeURIComponent(token ?? ''),
      url: 'http://127.0.0.1:3456',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

test('checked schedule uses the current WITA Monday', async ({ page }) => {
  await page.goto('/schedule')
  const pending = page.waitForResponse((response) => response.url().includes('/api/schedule') && response.url().includes('weekStart='))
  await page.getByText('Validasi ketersediaan armada mingguan').click()
  const response = await pending
  const weekStart = new URL(response.url()).searchParams.get('weekStart') ?? ''
  expect(weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(new Date(`${weekStart}T00:00:00Z`).getUTCDay()).toBe(1)
})

test('officer can mark a report collected and the dashboard can read that status', async ({ page }) => {
  await signInOfficer(page)
  const created = await page.request.post('/api/reports', {
    data: {
      text: 'Dua kantong plastik uji reaktivitas di gang.',
      lat: -8.65,
      lng: 115.22,
      accountType: 'household',
      classification: {
        types: [{ type: 'plastic', share: 1 }],
        volume: { liters: 12, label: 'small' },
        urgency: 'high',
        confidence: 0.8,
        rationale: 'Uji reaktivitas.',
        flags: ['no_image'],
        needsReview: false,
        reviewReasons: [],
        source: 'manual',
      },
    },
  })
  expect(created.ok()).toBeTruthy()
  const report = (await created.json()) as { data: { id: string; status: string } }
  expect(report.data.status).toBe('new')
  const collected = await page.request.post(`/api/reports/${report.data.id}/status`, {
    data: { status: 'collected' },
  })
  expect(collected.ok()).toBeTruthy()
  const saved = (await collected.json()) as { data: { status: string; collectionAudit?: Array<{ actor: string }> } }
  expect(saved.data.status).toBe('collected')
  expect(saved.data.collectionAudit?.[0]?.actor).toBeTruthy()
  const listed = await page.request.get('/api/reports?status=collected')
  expect(listed.ok()).toBeTruthy()
  const rows = (await listed.json()) as { data: Array<{ id: string }> }
  expect(rows.data.some((item) => item.id === report.data.id)).toBe(true)
})
