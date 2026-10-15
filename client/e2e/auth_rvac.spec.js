import { test, expect } from '@playwright/test';

test.describe('RVAC Role-Based Access Control & Personnel Login Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh session
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('Shows RVAC industrial personnel login enclave on initial visit', async ({ page }) => {
    await page.goto('/');

    // Check header and personnel cards
    await expect(page.locator('h1')).toContainText('Hydrogen Storage Facility Safety System');
    await expect(page.locator('#role-card-safety_engineer')).toBeVisible();
    await expect(page.locator('#role-card-operator')).toBeVisible();
    await expect(page.locator('#role-card-compliance_auditor')).toBeVisible();

    // Verify personnel names exist via specific heading role
    await expect(page.getByRole('heading', { name: 'Dr. Aris Thorne' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marcus Vance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Elena Rostova' })).toBeVisible();
  });

  test('Authenticates as Dr. Aris Thorne (Plant Safety Engineer) and verifies full clearance', async ({ page }) => {
    await page.goto('/');

    // Click Authorize button for Dr. Thorne
    await page.locator('#login-btn-thorne').click();

    // Verify main facility dashboard loads
    await expect(page.locator('#user-profile-badge')).toBeVisible();
    await expect(page.locator('#header-user-name')).toContainText('Dr. Aris Thorne');
    await expect(page.locator('#header-user-role')).toContainText('SE-7001');

    // Verify facility overview heading
    await expect(page.locator('.page-heading')).toContainText('Facility Safety & Telemetry Overview');
  });

  test('Authenticates as Marcus Vance (Control Room Operator) and switches persona cleanly', async ({ page }) => {
    await page.goto('/');

    // Click Authorize button for Marcus Vance
    await page.locator('#login-btn-vance').click();

    // Verify operator profile in header
    await expect(page.locator('#user-profile-badge')).toBeVisible();
    await expect(page.locator('#header-user-name')).toContainText('Marcus Vance');
    await expect(page.locator('#header-user-role')).toContainText('OP-4202');

    // Switch Role back to login screen via sidebar
    await page.locator('#sidebar-btn-switch-role').click();

    // Verify returned to login screen
    await expect(page.locator('#role-card-operator')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Marcus Vance' })).toBeVisible();
  });

  test('Authenticates as Elena Rostova (Lead Compliance Auditor) and verifies inspection badge', async ({ page }) => {
    await page.goto('/');

    // Click Authorize button for Elena Rostova
    await page.locator('#login-btn-rostova').click();

    // Verify auditor profile in header
    await expect(page.locator('#user-profile-badge')).toBeVisible();
    await expect(page.locator('#header-user-name')).toContainText('Elena Rostova');
    await expect(page.locator('#header-user-role')).toContainText('AUD-9103');
  });
});
