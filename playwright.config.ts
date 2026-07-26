import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3002';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-375',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 90_000,
    env: {
      DEMO_MODE: 'true',
      DRIZZLE_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/stellar_agent_b',
      SESSION_SECRET: 'bayadin-bills-session-secret-32chars-min-ok',
      STELLAR_NETWORK: 'testnet',
      STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
      STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
      NEXT_PUBLIC_APP_NAME: 'BayadinBills',
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
    },
  },
});
