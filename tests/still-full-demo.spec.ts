import { test, expect } from '@playwright/test';
import { safeGoto, captureStep, expectMeaningfulContent } from './utils/still-demo-helpers';
import { clearCatalog } from './utils/screenshot-catalog';

test.describe('Still Command Center Full Demo Walkthrough', () => {
  
  test.beforeAll(async () => {
    await clearCatalog();
  });

  test.beforeEach(async ({ page }) => {
    // Ensure we are logged in for every test
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Check if we are already on dashboard
    if (page.url().includes('/dashboard')) return;
    
    // Select Demo environment (it is the first one, but let's be explicit)
    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await select.selectOption({ label: 'Demo — Explore the app' });
      await page.waitForTimeout(500);
    }
    
    // Fill name and enter
    const nameInput = page.locator('input[autocomplete="name"], input[placeholder*="any name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Demo Visitor');
      await page.getByRole('button', { name: /enter demo/i }).click();
      // Wait for dashboard with a generous timeout
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    }

    // Skip walkthrough if it appears
    // The walkthrough starts with a delay, so we poll for it
    for (let i = 0; i < 5; i++) {
        const skipBtn = page.getByRole('button', { name: /Skip tour/i });
        if (await skipBtn.isVisible()) {
            await skipBtn.click();
            await expect(skipBtn).not.toBeVisible();
            break;
        }
        await page.waitForTimeout(1000);
    }

    // Wait for any dashboard content to ensure hydration and visibility
    await expect(page.getByText(/Today in/i).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  });

  test('1. Dashboard Smoke + Business Summary', async ({ page }) => {
    await safeGoto(page, '/dashboard');
    await expectMeaningfulContent(page, ['Hearth & Hollow', 'Dashboard', 'Productivity Snapshot', 'Action Center']);
    
    await captureStep(page, {
      id: 'dashboard-full',
      title: 'Command Center Dashboard',
      description: 'The Hearth & Hollow executive dashboard showing the 8-card operational architecture.',
      module: 'dashboard'
    });

    // Open AI Sidebar
    const askStillBtn = page.getByRole('button', { name: /Ask Still/i });
    if (await askStillBtn.isVisible()) {
      await askStillBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, {
        id: 'dashboard-ai-sidebar-open',
        title: 'Ask Still AI Assistant',
        description: 'Context-aware AI sidebar for natural language operational insights.',
        module: 'ai'
      });
      // Close it
      await page.keyboard.press('Escape');
    }
  });

  test('2. Action Center', async ({ page }) => {
    await safeGoto(page, '/action-center');
    await expectMeaningfulContent(page, ['Action Center', 'Critical', 'Mine']);
    
    await captureStep(page, {
      id: 'action-center-overview',
      title: 'Action Center',
      description: 'Centralized decision inbox for managing critical alerts, approvals, and data cleanup.',
      module: 'action-center'
    });
  });

  test('3. Operations Hub', async ({ page }) => {
    await safeGoto(page, '/operations');
    await expectMeaningfulContent(page, ['Operations', 'Station Health']);
    
    await captureStep(page, {
      id: 'operations-overview',
      title: 'Operations Hub',
      description: 'High-density view of production health and workstation status.',
      module: 'operations'
    });
  });

  test('4. Release Pipeline', async ({ page }) => {
    await safeGoto(page, '/release-pipeline');
    await expectMeaningfulContent(page, ['Release Pipeline', 'Planned']);
    
    await captureStep(page, {
      id: 'release-pipeline-kanban',
      title: 'Release Pipeline',
      description: 'Kanban visualization of the go-to-market flow from production to bottling.',
      module: 'release-pipeline'
    });
  });

  test('5. Finance Hub', async ({ page }) => {
    await safeGoto(page, '/finance');
    await expectMeaningfulContent(page, ['Finance', 'Valuation']);
    
    await captureStep(page, {
      id: 'finance-overview',
      title: 'Finance Hub',
      description: 'Decision-grade financial overview of barrel assets and projected release values.',
      module: 'finance'
    });
  });

  test('6. Compliance Hub', async ({ page }) => {
    await safeGoto(page, '/compliance');
    // Wait for the page to show either the content or the loading state
    await expect(page.getByText(/Compliance/i).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    
    await captureStep(page, {
      id: 'compliance-overview',
      title: 'Compliance Hub',
      description: 'Regulatory readiness dashboard with verification status and risk flags.',
      module: 'compliance'
    });
  });

  test('7. Engagement Hub', async ({ page }) => {
    await safeGoto(page, '/engagement');
    await expectMeaningfulContent(page, ['Consumer Engagement', 'Bottle Stories', 'Marketing Plays']);
    
    await captureStep(page, {
      id: 'engagement-overview',
      title: 'Engagement Hub',
      description: 'Consumer engagement tracking, QR bottle story metrics, and marketing performance.',
      module: 'engagement'
    });
  });

  test('8. Reports Portal', async ({ page }) => {
    await safeGoto(page, '/reports');
    await expectMeaningfulContent(page, ['Reports Portal', 'Recently Generated']);
    
    await captureStep(page, {
      id: 'reports-library',
      title: 'Reports Portal',
      description: 'Comprehensive library of automated and on-demand distillery reports.',
      module: 'reports'
    });

    // Try to open a report viewer
    const firstReport = page.getByText(/Daily Executive Summary/i).first();
    if (await firstReport.isVisible()) {
      await firstReport.click();
      await page.waitForTimeout(1000);
      await captureStep(page, {
        id: 'reports-document-viewer',
        title: 'Report Document Viewer',
        description: 'Interactive high-fidelity report preview for executive review.',
        module: 'reports'
      });
    }
  });

  test('9. Activity & Audit Log', async ({ page }) => {
    await safeGoto(page, '/audit');
    await expectMeaningfulContent(page, ['Audit Log', 'Action', 'Verified']);
    
    await captureStep(page, {
      id: 'activity-audit-log',
      title: 'Activity & Audit Log',
      description: 'Immutable trail of every operational action with cryptographic verification status.',
      module: 'audit'
    });
  });

  test('10. Admin & Setup', async ({ page }) => {
    await safeGoto(page, '/setup'); // Built as /setup in previous task
    await expectMeaningfulContent(page, ['Admin', 'Setup', 'Profile']);
    
    await captureStep(page, {
      id: 'admin-setup-overview',
      title: 'Admin & Setup',
      description: 'Enterprise-grade configuration for distilleries, teams, and workstations.',
      module: 'admin'
    });
  });

  test('11. End-to-end customer story: from dashboard priority to release decision', async ({ page }) => {
    // Start at dashboard
    await safeGoto(page, '/dashboard');
    
    // Go to Action Center
    await page.getByRole('link', { name: /Full Action Center/i }).click();
    await expect(page).toHaveURL(/\/action-center/);
    
    // Open the first action item if any exist
    const firstAction = page.locator('.group h3').first();
    if (await firstAction.isVisible()) {
        await firstAction.click();
        await page.waitForTimeout(500);
    }
    
    // Go to Release Pipeline
    await safeGoto(page, '/release-pipeline');
    // Just check that we have some pipeline content
    await expect(page.getByText(/Planned|Bottling/i).first()).toBeVisible();
    
    // End at Audit
    await safeGoto(page, '/audit');
    await expect(page.getByText(/Audit Log/i).first()).toBeVisible();

    await captureStep(page, {
      id: 'e2e-story-final',
      title: 'Full Traceability Story',
      description: 'Proving the connection between executive alerts and low-level audit records.',
      module: 'dashboard'
    });
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Mobile Dashboard', async ({ page }) => {
    await safeGoto(page, '/dashboard');
    await captureStep(page, {
      id: 'mobile-dashboard',
      title: 'Mobile Dashboard',
      description: 'Responsive executive view optimized for handheld devices.',
      module: 'dashboard'
    });
  });

  test('Mobile Action Center', async ({ page }) => {
    await safeGoto(page, '/action-center');
    await captureStep(page, {
      id: 'mobile-action-center',
      title: 'Mobile Action Center',
      description: 'Priority alerts accessible on the distillery floor.',
      module: 'action-center'
    });
  });

  test('Mobile Release Pipeline', async ({ page }) => {
    await safeGoto(page, '/release-pipeline');
    await captureStep(page, {
      id: 'mobile-release-pipeline',
      title: 'Mobile Release Pipeline',
      description: 'Pipeline tracking on the go.',
      module: 'release-pipeline'
    });
  });
});
