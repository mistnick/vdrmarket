import { test, expect } from '@playwright/test';

/**
 * E2E Team Collaboration Tests
 * Tests team management and collaboration features
 */

test.describe('Team Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'test@dataroom.local');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should display teams page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Navigate to teams section
    const teamsLink = page.locator('a[href*="/teams"]');
    if (await teamsLink.isVisible()) {
      await teamsLink.click();
      await expect(page).toHaveURL(/.*teams/);
    }
  });

  test('should create new team', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Click create team button
    await page.click('button:has-text("Create Team"), button:has-text("Crea Team")');
    
    // Fill team details
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Team E2E');
      
      const slugInput = page.locator('input[name="slug"]');
      if (await slugInput.isVisible()) {
        await slugInput.fill('test-team-e2e');
      }
      
      await page.click('button[type="submit"]');
      
      // Should show success
      await expect(page.locator('text=/success|creato/i')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should invite team member', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Navigate to team settings
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/members|membri|settings/i');
      
      // Click invite button
      await page.click('button:has-text("Invite"), button:has-text("Invita")');
      
      // Fill invitation form
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill(`newmember-${Date.now()}@example.com`);
        
        // Select role
        const roleSelect = page.locator('select[name="role"]');
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption('member');
        }
        
        await page.click('button[type="submit"]');
        
        // Should show success
        await expect(page.locator('text=/invited|invitato|sent/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should list team members', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/members|membri/i');
      
      // Should show members list
      await expect(page.locator('[data-testid="team-member"]')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should update team member role', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/members|membri/i');
      
      // Click on member menu
      const memberMenu = page.locator('[data-testid="member-menu"]').first();
      if (await memberMenu.isVisible()) {
        await memberMenu.click();
        await page.click('text=/change role|cambia ruolo/i');
        
        // Select new role
        const roleSelect = page.locator('select[name="role"]');
        if (await roleSelect.isVisible()) {
          await roleSelect.selectOption('editor');
          await page.click('button:has-text("Save"), button:has-text("Salva")');
          
          // Should show success
          await expect(page.locator('text=/updated|aggiornato/i')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    }
  });

  test('should create team data room', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Create data room
    await page.click('button:has-text("New Data Room"), button:has-text("Nuova Data Room")');
    
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Data Room');
      await page.click('button[type="submit"]');
      
      // Should navigate to data room
      await expect(page).toHaveURL(/.*datarooms\/[a-z0-9-]+/, { timeout: 5000 });
    }
  });

  test('should share document with team', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // Open document menu
    const docMenu = page.locator('[data-testid="document-menu"]').first();
    if (await docMenu.isVisible()) {
      await docMenu.click();
      await page.click('text=/share with team|condividi con team/i');
      
      // Select team
      const teamSelect = page.locator('select[name="team"]');
      if (await teamSelect.isVisible()) {
        await teamSelect.selectOption({ index: 0 });
        await page.click('button:has-text("Share"), button:has-text("Condividi")');
        
        // Should show success
        await expect(page.locator('text=/shared|condiviso/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should view team activity log', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/activity|attività/i');
      
      // Should show activity list
      await expect(page.locator('[data-testid="activity-item"]')).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should remove team member', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/members|membri/i');
      
      // Click on member menu (not owner)
      const memberMenus = page.locator('[data-testid="member-menu"]');
      const count = await memberMenus.count();
      
      if (count > 1) {
        await memberMenus.nth(1).click();
        await page.click('text=/remove|rimuovi/i');
        
        // Confirm removal
        await page.click('button:has-text("Confirm"), button:has-text("Conferma")');
        
        // Should show success
        await expect(page.locator('text=/removed|rimosso/i')).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test('should leave team', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    const teamMenu = page.locator('[data-testid="team-menu"]').first();
    if (await teamMenu.isVisible()) {
      await teamMenu.click();
      await page.click('text=/settings|impostazioni/i');
      
      // Click leave team (if not owner)
      const leaveButton = page.locator('button:has-text("Leave Team"), button:has-text("Lascia Team")');
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
        
        // Confirm
        await page.click('button:has-text("Confirm"), button:has-text("Conferma")');
        
        // Should redirect to dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 });
      }
    }
  });
});
