import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { SalesOrderPage } from '../pages/sales-order.page';
import { InvoicePage } from '../pages/invoice.page';
import { PaymentPage } from '../pages/payment.page';
import { PurchaseOrderPage } from '../pages/purchase-order.page';
import { GoodsReceiptPage } from '../pages/goods-receipt.page';
import { GLJournalPage } from '../pages/gl-journal.page';
import { InventoryPage } from '../pages/inventory.page';

const ADMIN_EMAIL = process.env.E2E_EMAIL || 'admin@unerp.dev';
const ADMIN_PASSWORD = process.env.E2E_PASSWORD || 'admin123';

type JourneyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  salesOrderPage: SalesOrderPage;
  invoicePage: InvoicePage;
  paymentPage: PaymentPage;
  purchaseOrderPage: PurchaseOrderPage;
  goodsReceiptPage: GoodsReceiptPage;
  glJournalPage: GLJournalPage;
  inventoryPage: InventoryPage;
};

export const test = base.extend<JourneyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  salesOrderPage: async ({ page }, use) => {
    await use(new SalesOrderPage(page));
  },
  invoicePage: async ({ page }, use) => {
    await use(new InvoicePage(page));
  },
  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },
  purchaseOrderPage: async ({ page }, use) => {
    await use(new PurchaseOrderPage(page));
  },
  goodsReceiptPage: async ({ page }, use) => {
    await use(new GoodsReceiptPage(page));
  },
  glJournalPage: async ({ page }, use) => {
    await use(new GLJournalPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});

export async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(ADMIN_EMAIL, ADMIN_PASSWORD);
}

export { ADMIN_EMAIL, ADMIN_PASSWORD };
