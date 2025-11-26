import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.locator("h1")).toContainText("Sign In");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should navigate to signup page", async ({ page }) => {
    await page.goto("/auth/login");

    await page.click("text=Sign up");
    await expect(page).toHaveURL("/auth/signup");
    await expect(page.locator("h1")).toContainText("Sign Up");
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Implement proper authentication
    // For now, this test will be skipped if not authenticated
  });

  test.skip("should display dashboard after login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test.skip("should show documents list", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("text=Documents")).toBeVisible();
  });
});

test.describe("Document Operations", () => {
  test.skip("should upload a document", async ({ page }) => {
    await page.goto("/dashboard");

    // Click upload button
    await page.click("text=Upload");

    // TODO: Implement file upload test
  });

  test.skip("should create a sharing link", async ({ page }) => {
    await page.goto("/dashboard");

    // TODO: Implement sharing link creation test
  });
});
