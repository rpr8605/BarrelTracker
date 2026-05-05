# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Magnolia environment >> RRUSSELL logs in via Magnolia environment
- Location: tests\auth.spec.ts:263:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Magnolia').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Magnolia').first()

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
  171 |       await expectDashboard(page)
  172 | 
  173 |       // Navigate to barrels — must stay authenticated
  174 |       await page.goto('/barrels', { waitUntil: 'domcontentloaded' })
  175 |       await expect(page).not.toHaveURL(/\/login/)
  176 |       await expect(page).not.toHaveURL(/\/onboarding/)
  177 |     })
  178 | 
  179 |     test('shows correct distillery name after login', async ({ page }) => {
  180 |       await fillUsername(page, user.username)
  181 |       await fillPassword(page, user.password)
  182 |       await page.getByRole('button', { name: /sign in/i }).click()
  183 |       await expectDashboard(page)
  184 | 
  185 |       const found = await Promise.any(
  186 |         user.distilleries.map((d) =>
  187 |           page.getByText(d, { exact: false }).waitFor({ timeout: 10_000 })
  188 |         )
  189 |       ).then(() => true).catch(() => false)
  190 | 
  191 |       expect(found, `None of [${user.distilleries.join(', ')}] appeared in the UI`).toBe(true)
  192 |     })
  193 | 
  194 |     test('wrong password shows an error', async ({ page }) => {
  195 |       await fillUsername(page, user.username)
  196 |       await fillPassword(page, 'WRONG_PASSWORD_XYZ_123')
  197 |       await page.getByRole('button', { name: /sign in/i }).click()
  198 |       // Should stay on login page with an error message
  199 |       await expect(page.locator('p').filter({ hasText: /incorrect|wrong|invalid|error/i }).first())
  200 |         .toBeVisible({ timeout: 15_000 })
  201 |       await expect(page).toHaveURL(/\/login/)
  202 |     })
  203 |   })
  204 | }
  205 | 
  206 | // ─── Invalid Credentials ─────────────────────────────────────────────────────
  207 | 
  208 | test.describe('Invalid credentials', () => {
  209 |   test.beforeEach(async ({ page }) => {
  210 |     await clearSession(page)
  211 |     await goToLogin(page)
  212 |     await selectEnvironment(page, 'Francis Distillery')
  213 |   })
  214 | 
  215 |   test('unknown username shows an error', async ({ page }) => {
  216 |     await fillUsername(page, 'NOBODY_XYZ_NOT_REAL')
  217 |     await fillPassword(page, 'anypassword')
  218 |     await page.getByRole('button', { name: /sign in/i }).click()
  219 |     await expect(page.locator('p').filter({ hasText: /not found|username/i }).first())
  220 |       .toBeVisible({ timeout: 15_000 })
  221 |     await expect(page).toHaveURL(/\/login/)
  222 |   })
  223 | 
  224 |   test('sign in button disabled when fields are empty', async ({ page }) => {
  225 |     await expect(page.getByRole('button', { name: /sign in/i })).toBeDisabled()
  226 |   })
  227 | })
  228 | 
  229 | // ─── Session Persistence ─────────────────────────────────────────────────────
  230 | 
  231 | test.describe('Session persistence', () => {
  232 |   test('stays logged in across page reload', async ({ page }) => {
  233 |     await clearSession(page)
  234 |     await goToLogin(page)
  235 |     await selectEnvironment(page, 'Francis Distillery')
  236 |     await fillUsername(page, 'RRUSSELL')
  237 |     await fillPassword(page, '1904W5th')
  238 |     await page.getByRole('button', { name: /sign in/i }).click()
  239 |     await expectDashboard(page)
  240 | 
  241 |     await page.reload({ waitUntil: 'networkidle' })
  242 |     await expect(page).toHaveURL(/\/dashboard/)
  243 |     await expect(page).not.toHaveURL(/\/login/)
  244 |   })
  245 | 
  246 |   test('authenticated user visiting /login redirects to /dashboard', async ({ page }) => {
  247 |     await clearSession(page)
  248 |     await goToLogin(page)
  249 |     await selectEnvironment(page, 'Francis Distillery')
  250 |     await fillUsername(page, 'RRUSSELL')
  251 |     await fillPassword(page, '1904W5th')
  252 |     await page.getByRole('button', { name: /sign in/i }).click()
  253 |     await expectDashboard(page)
  254 | 
  255 |     await page.goto('/login', { waitUntil: 'networkidle' })
  256 |     await expect(page).toHaveURL(/\/dashboard/)
  257 |   })
  258 | })
  259 | 
  260 | // ─── Magnolia Environment ─────────────────────────────────────────────────────
  261 | 
  262 | test.describe('Magnolia environment', () => {
  263 |   test('RRUSSELL logs in via Magnolia environment', async ({ page }) => {
  264 |     await clearSession(page)
  265 |     await goToLogin(page)
  266 |     await selectEnvironment(page, 'Magnolia Barrel House')
  267 |     await fillUsername(page, 'RRUSSELL')
  268 |     await fillPassword(page, '1904W5th')
  269 |     await page.getByRole('button', { name: /sign in/i }).click()
  270 |     await expectDashboard(page)
> 271 |     await expect(page.getByText('Magnolia', { exact: false }).first()).toBeVisible({ timeout: 10_000 })
      |                                                                        ^ Error: expect(locator).toBeVisible() failed
  272 |   })
  273 | })
  274 | 
```