import { Page, expect } from '@playwright/test';
import { addToCatalog, ScreenshotEntry } from './screenshot-catalog';
import path from 'path';

export async function expectNoAppError(page: Page) {
  const errorStrings = [
    "Unhandled Runtime Error",
    "Application error",
    "404",
    "Hydration failed",
    "TypeError",
    "ReferenceError",
    "Cannot read properties"
  ];
  
  for (const str of errorStrings) {
    await expect(page.locator('body')).not.toContainText(str);
  }
}

export async function expectMeaningfulContent(page: Page, labels: string[]) {
  for (const label of labels) {
    await expect(page.getByText(new RegExp(label, 'i')).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  }
}

export async function captureStep(
  page: Page, 
  options: {
    id: string;
    title: string;
    description: string;
    module: ScreenshotEntry['module'];
  }
) {
  // Wait for stability
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Settle animations
  
  const isMobile = page.viewportSize()?.width! < 600;
  const viewport = isMobile ? "mobile" : "desktop";
  
  const filename = `${options.id}-${viewport}.png`;
  const relativePath = `screenshots/${filename}`;
  const absolutePath = path.join(process.cwd(), 'docs/generated', relativePath);
  
  await page.screenshot({ path: absolutePath, fullPage: true });
  
  await addToCatalog({
    id: options.id,
    title: options.title,
    description: options.description,
    route: page.url(),
    path: relativePath,
    viewport,
    module: options.module,
    status: "captured"
  });
}

export async function safeGoto(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
  await expectNoAppError(page);
}
