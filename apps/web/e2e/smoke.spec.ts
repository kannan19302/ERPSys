import { test, expect, Page } from '@playwright/test';

/**
 * Autonomous-cycle smoke gate (AUTOPILOT.md Step 5, Gate 3).
 *
 * Logs in as the seeded admin and walks the core module surfaces, failing on:
 *  - login failure
 *  - Next.js error boundary / "Application error" / not-found renders
 *  - any 5xx API response observed while the page loads
 *
 * Requires the dev stack (web:3000, api:3001, seeded DB). Run:
 *   pnpm --filter @unerp/web test:e2e -- smoke
 */

const ADMIN_EMAIL = process.env.E2E_EMAIL || 'admin@unerp.dev';
const ADMIN_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

// One representative page per major module surface. Add a route here whenever a
// new module ships — this list is the binding definition of "the app boots".
const SMOKE_ROUTES: { path: string; marker?: string }[] = [
  { path: '/dashboard' },
  { path: '/finance/invoices' },
  { path: '/finance/advanced/expense-reports' },
  { path: '/finance/advanced/expense-policies' },
  { path: '/finance/advanced/allocations' },
  { path: '/finance/advanced/accounting-books' },
  { path: '/finance/advanced/corporate-cards/corp-card-sarah' },
  { path: '/finance/advanced/1099-reporting' },
  { path: '/finance/advanced/tax-nexus' },
  { path: '/finance/advanced' },
  { path: '/finance/advanced/account-reconciliation' },
  { path: '/finance/advanced/ap-automation' },
  { path: '/finance/advanced/ap-match-rules' },
  { path: '/finance/advanced/ar-aging' },
  { path: '/finance/advanced/ar-automation' },
  { path: '/finance/advanced/audit-logs' },
  { path: '/finance/advanced/bank-accounts' },
  { path: '/finance/advanced/bank-feeds' },
  { path: '/finance/advanced/bank-recon' },
  { path: '/finance/advanced/budget-scenarios' },
  { path: '/finance/advanced/budgeting' },
  { path: '/finance/advanced/cash-flow-forecast' },
  { path: '/finance/advanced/cash-position' },
  { path: '/finance/advanced/chart-of-accounts' },
  { path: '/finance/advanced/close-tasks' },
  { path: '/finance/advanced/consolidation' },
  { path: '/finance/advanced/credit-risk' },
  { path: '/finance/advanced/currency-revaluation' },
  { path: '/finance/advanced/customer-statement' },
  { path: '/finance/advanced/e-invoicing' },
  { path: '/finance/advanced/exception-queue' },
  { path: '/finance/advanced/exchange-rates' },
  { path: '/finance/advanced/financial-periods' },
  { path: '/finance/advanced/financial-ratios' },
  { path: '/finance/advanced/fixed-assets' },
  { path: '/finance/advanced/fixed-assets/assets' },
  { path: '/finance/advanced/fixed-assets/assets/new' },
  { path: '/finance/advanced/forecast-scenarios' },
  { path: '/finance/advanced/fx-revaluation' },
  { path: '/finance/advanced/intercompany/eliminations' },
  { path: '/finance/advanced/intercompany/netting' },
  { path: '/finance/advanced/invoice-analytics' },
  { path: '/finance/advanced/invoice-capture' },
  { path: '/finance/advanced/journal-entries' },
  { path: '/finance/advanced/leases' },
  { path: '/finance/advanced/leases/new' },
  { path: '/finance/advanced/payment-batches' },
  { path: '/finance/advanced/payment-terms' },
  { path: '/finance/advanced/reconciliations' },
  { path: '/finance/advanced/recurring' },
  { path: '/finance/advanced/reports' },
  { path: '/finance/advanced/revenue-schedules' },
  { path: '/finance/advanced/scenario-comparison' },
  { path: '/finance/advanced/subscriptions' },
  { path: '/finance/advanced/subscriptions/new' },
  { path: '/finance/advanced/tax-engine' },
  { path: '/finance/advanced/tax-filing-summary' },
  { path: '/finance/advanced/tax-filing' },
  { path: '/finance/advanced/treasury' },
  { path: '/crm/contacts' },
  { path: '/crm/leads' },
  { path: '/crm/customer-portal' },
  { path: '/crm/territories/assignment-rules' },
  { path: '/crm/sequences/cadences' },
  { path: '/crm/quotations/signatures' },
  { path: '/crm/forecasting/pipeline-risk' },
  { path: '/crm/forecasting/revenue-intelligence' },
  { path: '/crm/conversation-intelligence' },
  { path: '/crm/forecasting/conversion-analytics' },
  { path: '/crm/ai-drafting' },
  { path: '/crm/gamification' },
  { path: '/crm/commission-plans' },
  { path: '/inventory/products' },
  { path: '/hr/employees' },
  { path: '/procurement/purchase-orders' },
  { path: '/sales/orders' },
  { path: '/projects' },
  { path: '/manufacturing/work-orders' },
  { path: '/admin/users' },
  { path: '/reporting' },
];

const ERROR_MARKERS = [
  'Application error',
  'Internal Server Error',
  'Something went wrong',
  'This page could not be found',
];

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[type="email"]', ADMIN_EMAIL);
  await page.fill('[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Any authenticated landing counts; error stays on /login.
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });
}

test.describe('Smoke: core module surfaces render after login', () => {
  test('login succeeds with seeded admin', async ({ page }) => {
    await login(page);
  });

  for (const route of SMOKE_ROUTES) {
    test(`renders ${route.path} without errors`, async ({ page }) => {
      // Dev-mode first compile of a route can exceed the default 30s.
      test.setTimeout(90_000);
      const serverErrors: string[] = [];
      page.on('response', (res) => {
        if (res.status() >= 500) {
          serverErrors.push(`${res.status()} ${res.url()}`);
        }
      });

      await login(page);
      // 'networkidle' never settles on pages with polling/websockets — wait for
      // DOM + a short settle window instead.
      await page.goto(route.path, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await page.waitForTimeout(2_000);

      const body = (await page.locator('body').innerText()).slice(0, 5000);
      for (const marker of ERROR_MARKERS) {
        expect(body, `error marker "${marker}" on ${route.path}`).not.toContain(
          marker,
        );
      }
      expect(
        serverErrors,
        `5xx responses while loading ${route.path}:\n${serverErrors.join('\n')}`,
      ).toHaveLength(0);
    });
  }
});
