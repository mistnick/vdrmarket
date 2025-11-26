import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('DataRoom E2E Tests', () => {
    test.describe('Authentication Flow', () => {
        test('should show login page', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth/login`);

            await expect(page).toHaveTitle(/Login.*DataRoom/i);
            await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        });

        test('should show email/password login form', async ({ page }) => {
            await page.goto(`${BASE_URL}/auth/login`);

            // Check for email and password inputs
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
        });

        test('should redirect to login when accessing protected route', async ({ page }) => {
            await page.goto(`${BASE_URL}/dashboard`);

            // Should redirect to login
            await expect(page).toHaveURL(/\/auth\/login/);
        });
    });

    test.describe('Public Link Access', () => {
        test('should be able to access public link page', async ({ page }) => {
            // This test assumes there's a public link available
            // In a real scenario, you'd create one in beforeEach
            await page.goto(`${BASE_URL}/view/test-link`);

            // Should show document access page
            // Adjust based on your actual implementation
            await expect(page).toHaveURL(/\/view\//);
        });
    });

    test.describe('Authenticated User Flow', () => {
        test.use({
            // You can set up authentication state here
            // storageState: 'playwright/.auth/user.json'
        });

        // Skip these tests if no auth is configured
        test.skip('should access dashboard after login', async ({ page }) => {
            // Login flow
            await page.goto(`${BASE_URL}/auth/login`);
            await page.getByLabel(/email/i).fill('test@example.com');
            await page.getByLabel(/password/i).fill('password123');
            await page.getByRole('button', { name: /sign in/i }).click();

            // Should redirect to dashboard
            await expect(page).toHaveURL(/\/dashboard/);
            await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
        });

        test.skip('should be able to navigate to documents page', async ({ page }) => {
            await page.goto(`${BASE_URL}/dashboard`);

            // Navigate to documents
            await page.getByRole('link', { name: /documents/i }).click();
            await expect(page).toHaveURL(/\/documents/);
            await expect(page.getByRole('heading', { name: /documents/i })).toBeVisible();
        });

        test.skip('should be able to navigate to links page', async ({ page }) => {
            await page.goto(`${BASE_URL}/dashboard`);

            // Navigate to links
            await page.getByRole('link', { name: /links/i }).click();
            await expect(page).toHaveURL(/\/links/);
            await expect(page.getByRole('heading', { name: /links/i })).toBeVisible();
        });

        test.skip('should be able to navigate to data rooms page', async ({ page }) => {
            await page.goto(`${BASE_URL}/dashboard`);

            // Navigate to data rooms
            await page.getByRole('link', { name: /data rooms/i }).click();
            await expect(page).toHaveURL(/\/datarooms/);
            await expect(page.getByRole('heading', { name: /data rooms/i })).toBeVisible();
        });
    });

    test.describe('API Health Checks', () => {
        test('should have working API endpoints', async ({ request }) => {
            // Check auth session endpoint
            const sessionResponse = await request.get(`${BASE_URL}/api/auth/session`);
            expect(sessionResponse.ok()).toBeTruthy();
        });

        test('should return 401 for protected API without auth', async ({ request }) => {
            const response = await request.get(`${BASE_URL}/api/documents`);
            expect(response.status()).toBe(401);
        });
    });

    test.describe('Responsive Design', () => {
        test('should display properly on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto(`${BASE_URL}/auth/login`);

            await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        });

        test('should display properly on tablet', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto(`${BASE_URL}/auth/login`);

            await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        });

        test('should display properly on desktop', async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto(`${BASE_URL}/auth/login`);

            await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
        });
    });

    test.describe('Performance', () => {
        test('should load login page quickly', async ({ page }) => {
            const startTime = Date.now();
            await page.goto(`${BASE_URL}/auth/login`);
            const loadTime = Date.now() - startTime;

            // Should load in less than 3 seconds
            expect(loadTime).toBeLessThan(3000);
        });
    });
});
