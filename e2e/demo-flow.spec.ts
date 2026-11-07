import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import type { Plan } from '@/lib/schemas'

const shots = process.env.E2E_SHOTS ?? path.join('e2e', 'artifacts')

async function shot(page: Page, name: string) {
  await mkdir(shots, { recursive: true })
  await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true })
}

async function keepTwoTrucks(page: Page) {
  const remove = page.getByRole('button', { name: 'Remove' })
  while ((await remove.count()) > 2) {
    await remove.last().click()
  }
}

test('resident report, planner decisions, and reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Central Trash Agent' })).toBeVisible()
  await shot(page, '00-home')

  await page.getByRole('link', { name: 'Report a pile' }).click()
  await page.getByLabel('What do you see?').fill('Ada sampah plastik di gang dekat rumah')
  await page.getByRole('button', { name: 'Classify' }).click()
  await expect(page.getByText('Demo output:')).toBeVisible()
  await page.getByRole('checkbox', { name: "I've reviewed this" }).check()
  await page.getByLabel('Latitude').fill('-8.650000')
  await page.getByLabel('Longitude').fill('115.220000')
  await page.getByRole('button', { name: 'Submit report' }).click()
  await expect(page.getByRole('heading', { name: 'Report submitted' })).toBeVisible()
  const reportLine = await page.getByText(/^Report rpt_/).textContent()
  const reportId = reportLine?.replace('Report ', '').trim() ?? ''
  expect(reportId).toMatch(/^rpt_/)
  await expect(page.getByText('Not demo data')).toBeVisible()
  await shot(page, '01-report')

  await page.getByRole('link', { name: 'View the dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(reportId) })).toBeVisible()
  await shot(page, '02-dashboard')

  await page.getByRole('link', { name: 'Planner' }).click()
  await keepTwoTrucks(page)
  await page.locator('#truck-id-truck-1').fill('truck-small')
  await page.locator('#truck-cap-truck-1').fill('10')
  await page.locator('#truck-id-truck-2').fill('truck-big')
  await page.locator('#truck-cap-truck-2').fill('500000')
  await page.locator('#crews').fill('2')
  await page.locator('#shift-end').fill('18:00')
  await page.getByRole('button', { name: 'Run plan' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status proposed')
  await expect(page).toHaveURL(/plan=/)
  await shot(page, '03-plan')

  await page.locator('#move-stop').selectOption(reportId)
  await page.locator('#move-truck').selectOption('truck-small')
  await page.getByRole('button', { name: 'Save edit' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status edited_pending')
  await expect(page.getByText('not feasible')).toBeVisible()
  await shot(page, '04-edit')

  const blocked = page.waitForResponse((response) => response.url().includes('/decision') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Approve' }).click()
  expect((await blocked).status()).toBe(409)
  await expect(page.getByText('409 Approve is blocked until every route is feasible.')).toBeVisible()
  await expect(page.getByText('truck-small: over_capacity')).toBeVisible()
  await expect(page.getByTestId('plan-status')).toContainText('Status edited_pending')
  await shot(page, '05-approve-blocked')

  const capacities = page.locator('input[id^="truck-cap-"]')
  await capacities.nth(0).fill('500000')
  await capacities.nth(1).fill('500000')
  await page.getByRole('button', { name: 'Run plan' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status proposed')
  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status approved')
  const approvedUrl = page.url()
  await page.reload()
  await expect(page.getByTestId('plan-status')).toContainText('Status approved')
  await expect(page.getByTestId('audit-log')).toContainText('approve')
  const approvedId = new URL(approvedUrl).searchParams.get('plan')
  const approvedApi = await page.request.get(`/api/plans/${approvedId}`)
  expect(approvedApi.ok()).toBeTruthy()
  const approvedPlan = (await approvedApi.json()) as { data: Plan }
  expect(approvedPlan.data.status).toBe('approved')
  expect(approvedPlan.data.decisions.some((decision) => decision.action === 'approve')).toBe(true)
  await shot(page, '06-approve')

  await page.getByRole('button', { name: 'Run plan' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status proposed')
  await page.locator('#reject-note').fill('Crew is not available for this shift.')
  await page.getByRole('button', { name: 'Reject' }).click()
  await expect(page.getByTestId('plan-status')).toContainText('Status rejected')
  await expect(page.getByTestId('audit-log')).toContainText('Crew is not available for this shift.')
  await shot(page, '07-reject')

  const rejectedUrl = page.url()
  await page.reload()
  await expect(page.getByTestId('plan-status')).toContainText('Status rejected')
  await expect(page.getByTestId('audit-log')).toContainText('reject')
  await expect(page.getByTestId('audit-log')).toContainText('Crew is not available for this shift.')
  const rejectedId = new URL(rejectedUrl).searchParams.get('plan')
  const rejectedApi = await page.request.get(`/api/plans/${rejectedId}`)
  expect(rejectedApi.ok()).toBeTruthy()
  const rejectedPlan = (await rejectedApi.json()) as { data: Plan }
  expect(rejectedPlan.data.status).toBe('rejected')
  expect(rejectedPlan.data.decisions.some((decision) => decision.action === 'reject' && decision.note === 'Crew is not available for this shift.')).toBe(true)
  await shot(page, '08-reload-audit')
})
