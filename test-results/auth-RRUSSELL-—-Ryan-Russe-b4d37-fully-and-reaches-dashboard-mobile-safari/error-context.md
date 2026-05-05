# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> RRUSSELL — Ryan Russell — owner / admin >> logs in successfully and reaches dashboard
- Location: tests\auth.spec.ts:160:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "https://barrel-tracker.vercel.app/onboarding"
Timeout: 30000ms

Call log:
  - Expect "toHaveURL" with timeout 30000ms
    5 × unexpected value "https://barrel-tracker.vercel.app/login"
    28 × unexpected value "https://barrel-tracker.vercel.app/onboarding"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - heading "Still" [level=1] [ref=e6]
    - generic [ref=e7]:
      - paragraph [ref=e8]: Your account doesn't have access to a distillery yet.
      - paragraph [ref=e9]: Contact your administrator to be added.
      - button "Sign out" [ref=e10] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * Still — Login & Auth Test Suite
  3   |  *
  4   |  * Tests every named user account and the demo mode.
  5   |  * Run against the deployed URL:
  6   |  *   npx playwright test
  7   |  * Run against local dev:
  8   |  *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
  9   |  *
  10  |  * All users and passwords as of 2026-05-01:
  11  |  *   RRUSSELL  / 1904W5th     — full_access to all 3 distilleries
  12  |  *   DFRANCIS  / Still8626    — full_access to all 3 distilleries
  13  |  *   WFRANCIS  / William2024  — owner of Francis, full_access all 3
  14  |  *   GASH      / Gareth2024   — full_access to all 3 distilleries
  15  |  *   NPLATT    / RobKnowsBest — full_access to all 3 distilleries
  16  |  *   Demo      / (any name)   — passwordless, Demo Distillery
  17  |  */
  18  | 
  19  | import { test, expect, type Page } from '@playwright/test'
  20  | 
  21  | // ─── Helpers ─────────────────────────────────────────────────────────────────
  22  | 
  23  | async function clearSession(page: Page) {
  24  |   await page.context().clearCookies()
  25  |   await page.evaluate(() => {
  26  |     try { localStorage.clear() } catch { /* incognito */ }
  27  |     try { sessionStorage.clear() } catch {}
  28  |   })
  29  | }
  30  | 
  31  | async function goToLogin(page: Page) {
  32  |   await page.goto('/login', { waitUntil: 'domcontentloaded' })
  33  |   // Wait for the React app to hydrate
  34  |   await page.waitForSelector('select', { timeout: 20_000 })
  35  | }
  36  | 
  37  | async function selectEnvironment(page: Page, envLabel: string) {
  38  |   await page.locator('select').first().selectOption({ label: envLabel })
  39  |   // Wait for React to re-render the form (passwordless → password fields)
  40  |   await page.waitForTimeout(500)
  41  | }
  42  | 
  43  | async function loginWithPassword(page: Page, username: string, password: string) {
  44  |   // Use placeholder text as selector — works regardless of label association
  45  |   const usernameField = page.locator('input[autocomplete="username"], input[placeholder*="WFRANCIS"], input[placeholder*="WFRANCIS"]').first()
  46  |   // More robust: find by placeholder pattern
  47  |   await page.locator('input').filter({ hasAttribute: 'autocomplete', attributeValue: 'username' }).fill(username).catch(async () => {
  48  |     // Fallback: use the input that is NOT type=password and NOT the select
  49  |     await page.locator('input:not([type="password"])').first().fill(username)
  50  |   })
  51  |   await page.locator('input[type="password"]').fill(password)
  52  |   await page.getByRole('button', { name: /sign in/i }).click()
  53  | }
  54  | 
  55  | async function fillUsername(page: Page, username: string) {
  56  |   // Try autocomplete attribute first, then fallback to first non-password input
  57  |   const field = page.locator('input[autocomplete="username"]')
  58  |   const count = await field.count()
  59  |   if (count > 0) {
  60  |     await field.fill(username)
  61  |   } else {
  62  |     await page.locator('input:not([type="password"])').first().fill(username)
  63  |   }
  64  | }
  65  | 
  66  | async function fillPassword(page: Page, password: string) {
  67  |   await page.locator('input[type="password"]').fill(password)
  68  | }
  69  | 
  70  | async function expectDashboard(page: Page) {
> 71  |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  72  |   // The word "Still" must appear (brand name in sidebar or header)
  73  |   await expect(page.getByText('Still').first()).toBeVisible({ timeout: 15_000 })
  74  | }
  75  | 
  76  | // ─── Demo Mode ───────────────────────────────────────────────────────────────
  77  | 
  78  | test.describe('Demo mode', () => {
  79  |   test.beforeEach(async ({ page }) => {
  80  |     await clearSession(page)
  81  |     await goToLogin(page)
  82  |   })
  83  | 
  84  |   test('enters demo with any name', async ({ page }) => {
  85  |     // Demo is the default first environment (passwordless=true)
  86  |     // The input has placeholder "Enter any name" or autocomplete="name"
  87  |     const nameInput = page.locator('input[autocomplete="name"]')
  88  |     const count = await nameInput.count()
  89  |     if (count > 0) {
  90  |       await nameInput.fill('Test Visitor')
  91  |     } else {
  92  |       await page.locator('input').first().fill('Test Visitor')
  93  |     }
  94  |     await page.getByRole('button', { name: /enter demo/i }).click()
  95  |     await expectDashboard(page)
  96  |   })
  97  | 
  98  |   test('blocks demo submit with empty name', async ({ page }) => {
  99  |     const btn = page.getByRole('button', { name: /enter demo/i })
  100 |     await expect(btn).toBeDisabled()
  101 |   })
  102 | })
  103 | 
  104 | // ─── Named User Logins ───────────────────────────────────────────────────────
  105 | 
  106 | interface UserSpec {
  107 |   username: string
  108 |   password: string
  109 |   env: string
  110 |   distilleries: string[]
  111 |   description: string
  112 | }
  113 | 
  114 | const USERS: UserSpec[] = [
  115 |   {
  116 |     username: 'RRUSSELL',
  117 |     password: '1904W5th',
  118 |     env: 'Francis Distillery',
  119 |     distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
  120 |     description: 'Ryan Russell — owner / admin',
  121 |   },
  122 |   {
  123 |     username: 'DFRANCIS',
  124 |     password: 'Still8626',
  125 |     env: 'Francis Distillery',
  126 |     distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
  127 |     description: 'Danielle Francis — full access',
  128 |   },
  129 |   {
  130 |     username: 'WFRANCIS',
  131 |     password: 'William2024',
  132 |     env: 'Francis Distillery',
  133 |     distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
  134 |     description: 'William Francis — distillery owner',
  135 |   },
  136 |   {
  137 |     username: 'GASH',
  138 |     password: 'Gareth2024',
  139 |     env: 'Francis Distillery',
  140 |     distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
  141 |     description: 'Gareth Ash — full access',
  142 |   },
  143 |   {
  144 |     username: 'NPLATT',
  145 |     password: 'RobKnowsBest',
  146 |     env: 'Francis Distillery',
  147 |     distilleries: ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery'],
  148 |     description: 'N Platt — new admin',
  149 |   },
  150 | ]
  151 | 
  152 | for (const user of USERS) {
  153 |   test.describe(`${user.username} — ${user.description}`, () => {
  154 |     test.beforeEach(async ({ page }) => {
  155 |       await clearSession(page)
  156 |       await goToLogin(page)
  157 |       await selectEnvironment(page, user.env)
  158 |     })
  159 | 
  160 |     test('logs in successfully and reaches dashboard', async ({ page }) => {
  161 |       await fillUsername(page, user.username)
  162 |       await fillPassword(page, user.password)
  163 |       await page.getByRole('button', { name: /sign in/i }).click()
  164 |       await expectDashboard(page)
  165 |     })
  166 | 
  167 |     test('no redirect loop after login', async ({ page }) => {
  168 |       await fillUsername(page, user.username)
  169 |       await fillPassword(page, user.password)
  170 |       await page.getByRole('button', { name: /sign in/i }).click()
  171 |       await expectDashboard(page)
```