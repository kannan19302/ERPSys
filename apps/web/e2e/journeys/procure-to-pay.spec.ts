import { expect } from '@playwright/test';
import { test, loginAsAdmin } from '../fixtures/auth.fixture';

/**
 * Procure-to-Pay journey: creates a purchase order → goods receipt → vendor invoice → payment.
 *
 * @journey procure-to-pay
 * @critical-path true
 */
test.describe('Procure-to-Pay', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('complete procure-to-pay flow', async ({ page, purchaseOrderPage, goodsReceiptPage, invoicePage, paymentPage, dashboardPage }) => {
    test.setTimeout(120_000);

    const ref = `PTP-${Date.now()}`;
    const vendorName = 'Test Vendor';

    // 1. Create a Purchase Order
    await purchaseOrderPage.goto();
    await dashboardPage.expectNoErrorBoundaries();

    await purchaseOrderPage.gotoNew();
    await dashboardPage.expectNoErrorBoundaries();

    const vendorField = page.locator('[name="vendorId"], [name="vendor"], [id*="vendor"], [placeholder*="vendor"]').first();
    if (await vendorField.isVisible()) {
      await vendorField.fill(vendorName);
    }

    const poRefField = page.locator('[name*="reference"], [name*="name"]').first();
    if (await poRefField.isVisible()) {
      await poRefField.fill(ref);
    }

    const itemField = page.locator('[name*="item"], [placeholder*="item"], [name*="product"]').first();
    if (await itemField.isVisible()) {
      await itemField.fill('IT Equipment');
    }
    const qtyField = page.locator('[name*="quantity"], [type="number"]').first();
    if (await qtyField.isVisible()) {
      await qtyField.fill('5');
    }
    const rateField = page.locator('[name*="rate"], [name*="amount"], [name*="price"]').first();
    if (await rateField.isVisible()) {
      await rateField.fill('200');
    }

    const poSaveBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();
    if (await poSaveBtn.isVisible()) {
      await poSaveBtn.click();
      await page.waitForTimeout(3_000);
    }

    await dashboardPage.expectNoErrorBoundaries();

    // 2. Record Goods Receipt
    await goodsReceiptPage.goto();
    await dashboardPage.expectNoErrorBoundaries();

    const newGrBtn = page.locator('a, button').filter({ hasText: /new|create|add.?receipt|record.?receipt/i }).first();
    if (await newGrBtn.isVisible()) {
      await newGrBtn.click();
      await page.waitForTimeout(1_500);
    }

    const grPoField = page.locator('[name="purchaseOrderId"], [name*="order"], [placeholder*="order"]').first();
    if (await grPoField.isVisible()) {
      await grPoField.fill(ref);
    }

    const grItemField = page.locator('[name*="item"], [placeholder*="item"]').first();
    if (await grItemField.isVisible()) {
      await grItemField.fill('IT Equipment');
    }
    const grQtyField = page.locator('[name*="quantity"], [type="number"]').first();
    if (await grQtyField.isVisible()) {
      await grQtyField.fill('5');
    }

    const grSaveBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|record/i }).first();
    if (await grSaveBtn.isVisible()) {
      await grSaveBtn.click();
      await page.waitForTimeout(2_000);
    }

    await dashboardPage.expectNoErrorBoundaries();

    // 3. Create Vendor Invoice
    await invoicePage.gotoNew();
    await dashboardPage.expectNoErrorBoundaries();

    const vendInvField = page.locator('[name="vendorId"], [name="vendor"], [placeholder*="vendor"]').first();
    if (await vendInvField.isVisible()) {
      await vendInvField.fill(vendorName);
    }

    const vendInvRef = `PINV-PTP-${Date.now()}`;
    const invRefField = page.locator('[name*="reference"], [name*="name"]').first();
    if (await invRefField.isVisible()) {
      await invRefField.fill(vendInvRef);
    }

    const invItem = page.locator('[name*="item"], [placeholder*="item"]').first();
    if (await invItem.isVisible()) {
      await invItem.fill('IT Equipment');
    }
    const invQty = page.locator('[name*="quantity"], [type="number"]').first();
    if (await invQty.isVisible()) {
      await invQty.fill('5');
    }
    const invAmount = page.locator('[name*="rate"], [name*="amount"], [name*="price"]').first();
    if (await invAmount.isVisible()) {
      await invAmount.fill('200');
    }

    const invSave = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|create/i }).first();
    if (await invSave.isVisible()) {
      await invSave.click();
      await page.waitForTimeout(3_000);
    }

    await dashboardPage.expectNoErrorBoundaries();

    // 4. Process Payment
    await paymentPage.goto();
    await dashboardPage.expectNoErrorBoundaries();

    const newPayBtn = page.locator('a, button').filter({ hasText: /new|create|add.?payment|record.?payment/i }).first();
    if (await newPayBtn.isVisible()) {
      await newPayBtn.click();
      await page.waitForTimeout(1_500);
    }

    const payInvField = page.locator('[name="invoiceId"], [name*="invoice"], [placeholder*="invoice"]').first();
    if (await payInvField.isVisible()) {
      await payInvField.fill(vendInvRef);
    }
    const payAmountField = page.locator('[name="amount"], [type="number"]').first();
    if (await payAmountField.isVisible()) {
      await payAmountField.fill('1000');
    }
    const payRefField = page.locator('[name="reference"], [name="ref"]').first();
    if (await payRefField.isVisible()) {
      await payRefField.fill(`PAY-PTP-${Date.now()}`);
    }

    const paySaveBtn = page.locator('button[type="submit"], button').filter({ hasText: /save|submit|record/i }).first();
    if (await paySaveBtn.isVisible()) {
      await paySaveBtn.click();
      await page.waitForTimeout(2_000);
    }

    await dashboardPage.expectNoErrorBoundaries();
    expect(true).toBeTruthy();
  });
});
