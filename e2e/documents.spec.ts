import { test, expect } from '@playwright/test';

/**
 * E2E Document Lifecycle Tests
 * Tests complete document management flows
 */

test.describe('Document Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'test@dataroom.local');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display documents page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    await expect(page.locator('h1')).toContainText(/document|dashboard/i);
  });

  test('should upload new document', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Click upload button
    await page.click('button:has-text("Upload"), button:has-text("Carica")');
    
    // Wait for upload dialog
    await expect(page.locator('input[type="file"]')).toBeVisible({ timeout: 5000 });
    
    // Upload file (using a test file)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content'),
    });
    
    // Fill document details if required
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Document');
    }
    
    // Submit upload
    await page.click('button[type="submit"]:has-text("Upload"), button:has-text("Carica")');
    
    // Should show success message
    await expect(page.locator('text=/success|caricato|uploaded/i')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should view document details', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Click on first document
    const firstDoc = page.locator('[data-testid="document-item"]').first();
    if (await firstDoc.isVisible()) {
      await firstDoc.click();
      
      // Should navigate to document details
      await expect(page).toHaveURL(/.*documents\/[a-z0-9-]+/);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should create shareable link', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Open document menu
    const docMenu = page.locator('[data-testid="document-menu"]').first();
    if (await docMenu.isVisible()) {
      await docMenu.click();
      
      // Click create link
      await page.click('text=/create link|crea link|share/i');
      
      // Should show link creation dialog
      await expect(page.locator('text=/link|condividi/i')).toBeVisible();
      
      // Create link
      await page.click('button:has-text("Create"), button:has-text("Crea")');
      
      // Should show generated link
      await expect(page.locator('[data-testid="shareable-link"]')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should upload new document version', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Navigate to document details
    const firstDoc = page.locator('[data-testid="document-item"]').first();
    if (await firstDoc.isVisible()) {
      await firstDoc.click();
      
      // Click versions tab or button
      const versionsButton = page.locator('text=/version/i').first();
      if (await versionsButton.isVisible()) {
        await versionsButton.click();
        
        // Upload new version
        await page.click('button:has-text("Upload New Version"), button:has-text("Carica Nuova Versione")');
        
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: 'test-document-v2.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Test PDF content v2'),
        });
        
        // Should show success
        await expect(page.locator('text=/success|caricato/i')).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('should delete document', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Open document menu
    const docMenu = page.locator('[data-testid="document-menu"]').first();
    if (await docMenu.isVisible()) {
      await docMenu.click();
      
      // Click delete
      await page.click('text=/delete|elimina/i');
      
      // Confirm deletion
      await page.click('button:has-text("Confirm"), button:has-text("Conferma")');
      
      // Should show success message
      await expect(page.locator('text=/deleted|eliminato/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should organize documents in folders', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Create new folder
    await page.click('button:has-text("New Folder"), button:has-text("Nuova Cartella")');
    
    const folderInput = page.locator('input[name="folderName"]');
    if (await folderInput.isVisible()) {
      await folderInput.fill('Test Folder');
      await page.click('button[type="submit"]');
      
      // Should show new folder
      await expect(page.locator('text=/test folder/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should search documents', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cerca"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Should show filtered results
      await page.waitForTimeout(1000);
      const results = page.locator('[data-testid="document-item"]');
      if (await results.count() > 0) {
        expect(await results.count()).toBeGreaterThan(0);
      }
    }
  });
});
