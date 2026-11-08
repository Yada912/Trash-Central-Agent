import { defineConfig } from '@playwright/test'

process.env.DEMO_WARGA_PASSWORD ||= 'ci-warga-only'
process.env.DEMO_PETUGAS_PASSWORD ||= 'ci-petugas-only'
process.env.SESSION_SECRET ||= 'e2e-session-secret-32'

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:3456',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm start --port 3456',
    url: 'http://127.0.0.1:3456',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
      ),
      SESSION_SECRET: process.env.SESSION_SECRET || 'e2e-session-secret-32',
      DEMO_WARGA_PASSWORD: process.env.DEMO_WARGA_PASSWORD || 'ci-warga-only',
      DEMO_PETUGAS_PASSWORD: process.env.DEMO_PETUGAS_PASSWORD || 'ci-petugas-only',
    },
  },
})
