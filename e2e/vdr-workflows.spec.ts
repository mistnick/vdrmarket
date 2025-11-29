import { test, expect } from '@playwright/test';

/**
 * E2E Tests for VDR Group Management
 */

test.describe('VDR Group Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as administrator
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // Navigate to data room
        await page.goto('/data-rooms/test-dataroom-id/vdr');
        await page.waitForLoadState('networkidle');
    });

    test('should display groups list', async ({ page }) => {
        // Check if groups tab is visible
        await expect(page.getByRole('tab', { name: /groups/i })).toBeVisible();

        // Click on groups tab
        await page.getByRole('tab', { name: /groups/i }).click();

        // Should show groups or empty state
        const groupsExist = await page.locator('[data-testid="group-card"]').count() > 0;
        const emptyState = await page.locator('text=/no groups found/i').isVisible();

        expect(groupsExist || emptyState).toBeTruthy();
    });

    test('should create a new CUSTOM group', async ({ page }) => {
        // Navigate to groups tab
        await page.getByRole('tab', { name: /groups/i }).click();

        // Click create group button
        await page.click('button:has-text("Create Group")');

        // Fill group form
        await page.fill('input[name="name"]', 'Test Custom Group');
        await page.fill('input[name="description"]', 'E2E test group');

        // Select CUSTOM type
        await page.click('[name="type"]');
        await page.click('text=CUSTOM');

        // Enable some permissions
        await page.check('input[name="canViewDueDiligenceChecklist"]');
        await page.check('input[name="canManageDocumentPermissions"]');

        // Submit form
        await page.click('button[type="submit"]:has-text("Create")');

        // Wait for success
        await expect(page.locator('text=/group created successfully/i')).toBeVisible();

        // Verify group appears in list
        await expect(page.locator('text=Test Custom Group')).toBeVisible();
    });

    test('should edit existing group', async ({ page }) => {
        await page.getByRole('tab', { name: /groups/i }).click();

        // Find first group and click edit
        const firstGroup = page.locator('[data-testid="group-card"]').first();
        await firstGroup.locator('button:has-text("Edit")').click();

        // Update description
        await page.fill('input[name="description"]', 'Updated description');

        // Save
        await page.click('button[type="submit"]:has-text("Save")');

        // Verify update
        await expect(page.locator('text=/group updated successfully/i')).toBeVisible();
    });

    test('should delete a group', async ({ page }) => {
        await page.getByRole('tab', { name: /groups/i }).click();

        // Find a non-administrator group
        const customGroup = page.locator('[data-testid="group-card"]:has-text("CUSTOM")').first();

        if (await customGroup.isVisible()) {
            await customGroup.locator('button:has-text("Delete")').click();

            // Confirm deletion
            await page.click('button:has-text("Confirm")');

            // Verify deletion
            await expect(page.locator('text=/group deleted successfully/i')).toBeVisible();
        }
    });
});

test.describe('VDR User Invitation Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
        await page.goto('/data-rooms/test-dataroom-id/vdr');
    });

    test('should invite a new user', async ({ page }) => {
        // Navigate to users tab
        await page.click('tab:has-text("Users")');

        // Click invite button
        await page.click('button:has-text("Invite User")');

        // Fill invitation form
        await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);

        // Select group
        await page.click('[data-testid="group-selector"]');
        await page.click('text=Administrators');

        // Set access type
        await page.click('[name="accessType"]');
        await page.click('text=UNLIMITED');

        // Enable 2FA
        await page.check('input[name="require2FA"]');

        // Submit
        await page.click('button[type="submit"]:has-text("Send Invitation")');

        // Verify success
        await expect(page.locator('text=/invitation sent successfully/i')).toBeVisible();
    });

    test('should display invited users with PENDING status', async ({ page }) => {
        await page.click('tab:has-text("Users")');

        // Check for pending users
        const pendingUsers = page.locator('[data-testid="user-status"]:has-text("PENDING")');

        if (await pendingUsers.count() > 0) {
            await expect(pendingUsers.first()).toBeVisible();
        }
    });

    test('should update user access settings', async ({ page }) => {
        await page.click('tab:has-text("Users")');

        // Find first active user
        const activeUser = page.locator('[data-testid="user-row"]:has([data-testid="user-status"]:has-text("ACTIVE"))').first();

        if (await activeUser.isVisible()) {
            // Click edit
            await activeUser.locator('button:has-text("Edit")').click();

            // Change access type to LIMITED
            await page.click('[name="accessType"]');
            await page.click('text=LIMITED');

            // Set access window
            await page.fill('input[name="accessEndAt"]', '2024-12-31');

            // Save
            await page.click('button:has-text("Save")');

            // Verify
            await expect(page.locator('text=/user updated successfully/i')).toBeVisible();
        }
    });
});

test.describe('VDR Permission Assignment', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');
    });

    test('should set document permissions for a group', async ({ page }) => {
        // Navigate to file explorer
        await page.goto('/file-explorer');

        // Find first document
        const firstDoc = page.locator('[data-testid="document-item"]').first();

        if (await firstDoc.isVisible()) {
            // Open context menu
            await firstDoc.click({ button: 'right' });

            // Click manage permissions
            await page.click('text=Manage Permissions');

            // Switch to groups tab
            await page.click('tab:has-text("Group Permissions")');

            // Find first group
            const firstGroup = page.locator('[data-testid="permission-group-row"]').first();

            // Enable view permission
            await firstGroup.locator('input[name="canView"]').check();

            // Enable download PDF
            await firstGroup.locator('input[name="canDownloadPdf"]').check();

            // Save
            await firstGroup.locator('button:has-text("Save")').click();

            // Verify
            await expect(page.locator('text=/permissions updated/i')).toBeVisible();
        }
    });

    test('should set user-specific permission override', async ({ page }) => {
        await page.goto('/file-explorer');

        const firstDoc = page.locator('[data-testid="document-item"]').first();

        if (await firstDoc.isVisible()) {
            await firstDoc.click({ button: 'right' });
            await page.click('text=Manage Permissions');

            // Switch to user overrides tab
            await page.click('tab:has-text("User Overrides")');

            // Click add user override
            await page.click('button:has-text("Add User Override")');

            // Select user
            await page.click('[data-testid="user-selector"]');
            await page.locator('[data-testid="user-option"]').first().click();

            // Set permissions
            await page.check('input[name="canView"]');
            await page.check('input[name="canManage"]');

            // Save
            await page.click('button:has-text("Add Override")');

            // Verify
            await expect(page.locator('text=/override added/i')).toBeVisible();
        }
    });
});
