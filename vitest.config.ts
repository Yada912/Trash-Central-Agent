import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      SESSION_SECRET: 'vitest-session-secret-32',
    },
    include: ['tests/**/*.test.ts', 'lib/ai/**/*.test.ts', 'lib/planner/**/*.test.ts', 'lib/schedule/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
