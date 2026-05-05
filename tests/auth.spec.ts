/**
 * Still — Login & Auth Test Suite
 *
 * Tests every named user account and the demo mode.
 * Run against the deployed URL:
 *   npx playwright test
 * Run against local dev:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
 *
 * All users and passwords as of 2026-05-01:
 *   RRUSSELL  / 1904W5th     — full_access to all 3 distilleries
 *   DFRANCIS  / Still8626    — full_access to all 3 distilleries
 *   WFRANCIS  / William2024  — owner of Francis, full_access all 3
 *   GASH      / Gareth2024   — full_access to all 3 distilleries
 *   NPLATT    / RobKnowsBest — full_access to all 3 distilleries
 *   Demo      / (any name)   — passwordless, Demo Distillery
 */

import { test, expect, type Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function clearSession(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    try { localStorage.clear() } catch { /* incognito */ }
    try { sessionStorage.clear() } catch {}
  })
}

async function goToLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  // Wait for the React app to hydrate
  await page.waitForSelector('select', { timeout: 20_000 })
}

async function selectEnvironment(page: Page, envLabel: string) {
  await page.locator('select').first().selectOption({ label: envLabel })
  // Wait for React to re-render the form (passwordless → password fields)
  await page.waitForTimeout(500)
}

async function loginWithPassword(page: Page, username: string, password: string) {
  // Use placeholder text as selector — works regardless of label association
  const usernameField = page.locator('input[autocomplete="username"], input[placeholder*="WFRANCIS"], input[placeholder*="WFRANCIS"]').first()
  // More robust: find by placeholder pattern
  await page.locator('input').filter({ hasAttribute: 'autocomplete', attributeValue: 'username' }).fill(username).catch(async () => {
    // Fallback: use the input that is NOT type=password and NOT the select
    await page.locator('input:not([type="password"])').first().fill(username)
  })
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

async function fillUsername(page: Page, username: string) {
  // Try autocomplete attribute first, then fallback to first non-password input
  const field = page.locator('input[autocomplete="username"]')
  const count = await field.count()
  if (count > 0) {
    await field.fill(username)
  } else {
    await page.locator('input:not([type="password"])').first().fill(username)
  }
}

async function fillPassword(page: Page, password: string) {
  await page.locator('input[type="password"]').fill(password)
}

async function expectDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  // The word "Still" must appear (brand name in sidebar or header)
  await expect(page.getByText('Still').first()).toBeVisible({ timeout: 15_000 })
}

// ─── Demo Mode ───────────────────────────────────────────────────────────────

test.describe('Demo mode', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
    await goToLogin(page)
  })

  test('enters demo with any name', async ({ page }) => {
    // Demo is the default first environment (passwordless=true)
    // The input has placeholder "Enter any name" or autocomplete="name"
    const nameInput = page.locator('input[autocomplete="name"]')
    const count = await nameInput.count()
    if (count > 0) {
      await nameInput.fill('Test Visitor')
    } else {
      await page.locator('input').first().fill('Test Visitor')
    }
    await page.getByRole('button', { name: /enter demo/i }).click()
    await expectDashboard(page)
  })

  test('blocks demo submit with empty name', async ({ page }) => {
    const btn = page.getByRole('button', { name: /enter demo/i })
    await expect(btn).toBeDisabled()
  })
})

// ─── Named User Logins ───────────────────────────────────────────────────────

interface UserSpec {
  username: string
  password: string
  env: string
  distilleries: string[]
  description: string
}

const USERS: UserSpec[] = [
  {
    username: 'RRUSSELL',
    password: '1904W5th',
    env: 'Francis Distillery',
    distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
    description: 'Ryan Russell — owner / admin',
  },
  {
    username: 'DFRANCIS',
    password: 'Still8626',
    env: 'Francis Distillery',
    distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
    description: 'Danielle Francis — full access',
  },
  {
    username: 'WFRANCIS',
    password: 'William2024',
    env: 'Francis Distillery',
    distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
    description: 'William Francis — distillery owner',
  },
  {
    username: 'GASH',
    password: 'Gareth2024',
    env: 'Francis Distillery',
    distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
    description: 'Gareth Ash — full access',
  },
  {
    username: 'NPLATT',
    password: 'RobKnowsBest',
    env: 'Francis Distillery',
    distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
    description: 'N Platt — new admin',
  },
]

for (const user of USERS) {
  test.describe(`${user.username} — ${user.description}`, () => {
    test.beforeEach(async ({ page }) => {
      await clearSession(page)
      await goToLogin(page)
      await selectEnvironment(page, user.env)
    })

    test('logs in successfully and reaches dashboard', async ({ page }) => {
      await fillUsername(page, user.username)
      await fillPassword(page, user.password)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expectDashboard(page)
    })

    test('no redirect loop after login', async ({ page }) => {
      await fillUsername(page, user.username)
      await fillPassword(page, user.password)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expectDashboard(page)

      // Navigate to barrels — must stay authenticated
      await page.goto('/barrels', { waitUntil: 'domcontentloaded' })
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page).not.toHaveURL(/\/onboarding/)
    })

    test('shows correct distillery name after login', async ({ page }) => {
      await fillUsername(page, user.username)
      await fillPassword(page, user.password)
      await page.getByRole('button', { name: /sign in/i }).click()
      await expectDashboard(page)

      const found = await Promise.any(
        user.distilleries.map((d) =>
          page.getByText(d, { exact: false }).waitFor({ timeout: 10_000 })
        )
      ).then(() => true).catch(() => false)

      expect(found, `None of [${user.distilleries.join(', ')}] appeared in the UI`).toBe(true)
    })

    test('wrong password shows an error', async ({ page }) => {
      await fillUsername(page, user.username)
      await fillPassword(page, 'WRONG_PASSWORD_XYZ_123')
      await page.getByRole('button', { name: /sign in/i }).click()
      // Should stay on login page with an error message
      await expect(page.locator('p').filter({ hasText: /incorrect|wrong|invalid|error/i }).first())
        .toBeVisible({ timeout: 15_000 })
      await expect(page).toHaveURL(/\/login/)
    })
  })
}

// ─── Invalid Credentials ─────────────────────────────────────────────────────

test.describe('Invalid credentials', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page)
    await goToLogin(page)
    await selectEnvironment(page, 'Francis Distillery')
  })

  test('unknown username shows an error', async ({ page }) => {
    await fillUsername(page, 'NOBODY_XYZ_NOT_REAL')
    await fillPassword(page, 'anypassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.locator('p').filter({ hasText: /not found|username/i }).first())
      .toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('sign in button disabled when fields are empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })
})

// ─── Session Persistence ─────────────────────────────────────────────────────

test.describe('Session persistence', () => {
  test('stays logged in across page reload', async ({ page }) => {
    await clearSession(page)
    await goToLogin(page)
    await selectEnvironment(page, 'Francis Distillery')
    await fillUsername(page, 'RRUSSELL')
    await fillPassword(page, '1904W5th')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expectDashboard(page)

    await page.reload({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('authenticated user visiting /login redirects to /dashboard', async ({ page }) => {
    await clearSession(page)
    await goToLogin(page)
    await selectEnvironment(page, 'Francis Distillery')
    await fillUsername(page, 'RRUSSELL')
    await fillPassword(page, '1904W5th')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expectDashboard(page)

    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

// ─── Magnolia Environment ─────────────────────────────────────────────────────

test.describe('Magnolia environment', () => {
  test('RRUSSELL logs in via Magnolia environment', async ({ page }) => {
    await clearSession(page)
    await goToLogin(page)
    await selectEnvironment(page, 'Magnolia Barrel House')
    await fillUsername(page, 'RRUSSELL')
    await fillPassword(page, '1904W5th')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expectDashboard(page)
    await expect(page.getByText('Magnolia', { exact: false }).first()).toBeVisible({ timeout: 10_000 })
  })
})
