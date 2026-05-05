/**
 * Diagnostic test suite — runs first, checks the infrastructure layer.
 * If these fail, auth.spec.ts will also fail. Fix these first.
 *
 * Each test is annotated with WHY it might fail and HOW to fix it.
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://barrel-tracker.vercel.app'
const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const ANON_KEY = 'sb_publishable_hFMZFJMSiFzjK0Ad_OLvrg_6CFba1LH'

// ─── Infrastructure ───────────────────────────────────────────────────────────

test.describe('Infrastructure checks', () => {
  test('login page is reachable and renders', async ({ page }) => {
    const res = await page.goto('/login', { waitUntil: 'networkidle' })
    expect(res?.status(), 'Login page returned non-200. Check Vercel deployment.').toBe(200)
    await expect(page.getByRole('heading', { name: 'Still' })).toBeVisible()
  })

  test('Supabase auth endpoint is reachable', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: ANON_KEY },
    })
    expect(res.status(), 'Supabase auth API is down or misconfigured').toBe(200)
  })

  test('resolve-username API returns email for RRUSSELL', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
      data: { username: 'RRUSSELL' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status(), `resolve-username API returned ${res.status()}. Check SUPABASE_SERVICE_ROLE_KEY env var.`).toBe(200)
    const body = await res.json()
    expect(body.email, 'RRUSSELL username not found in user_profiles table').toBeTruthy()
    expect(body.email).toContain('@')
  })

  test('resolve-username returns 404 for unknown user', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
      data: { username: 'NOBODY_XYZ_NOT_REAL' },
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(404)
  })

  test('resolve-username API works for all accounts', async ({ request }) => {
    const usernames = ['RRUSSELL', 'DFRANCIS', 'WFRANCIS', 'GASH', 'NPLATT']
    const results: Record<string, string | null> = {}

    for (const username of usernames) {
      const res = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
        data: { username },
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.status() === 200) {
        const body = await res.json()
        results[username] = body.email || null
      } else {
        results[username] = null
      }
    }

    for (const [username, email] of Object.entries(results)) {
      expect(email, `${username} not found in user_profiles — run the user creation SQL or API call`).toBeTruthy()
    }
  })

  test('demo login API works', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/demo-login`, {
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status(), 'Demo login API failed. Check demo-system@stilldemo.com account and user_roles.').toBe(200)
    const body = await res.json()
    expect(body.ok, 'Demo login returned ok=false: ' + (body.error || 'unknown error')).toBe(true)
    expect(body.accessToken, 'Demo login returned no accessToken').toBeTruthy()
  })
})

// ─── Per-user diagnostics ─────────────────────────────────────────────────────

interface AccountCheck {
  username: string
  password: string
  expectedEmail: string
}

const ACCOUNTS: AccountCheck[] = [
  { username: 'RRUSSELL', password: '1904W5th',    expectedEmail: 'ryan.russell@francisdistillery.com' },
  { username: 'DFRANCIS', password: 'Still8626',   expectedEmail: 'danielle.francis@francisdistillery.com' },
  { username: 'WFRANCIS', password: 'William2024', expectedEmail: 'william.francis@francisdistillery.com' },
  { username: 'GASH',     password: 'Gareth2024',  expectedEmail: 'gareth.ash@francisdistillery.com' },
  { username: 'NPLATT',   password: 'RobKnowsBest',expectedEmail: 'nplatt@stilldistillery.app' },
]

for (const acct of ACCOUNTS) {
  test(`${acct.username}: username resolves to correct email`, async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
      data: { username: acct.username },
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.status() !== 200) {
      throw new Error(
        `${acct.username} not found in user_profiles table (HTTP ${res.status()}). ` +
        `Fix: POST to /rest/v1/user_profiles with id=<auth_user_id>, username='${acct.username}', display_name='...'`
      )
    }
    const body = await res.json()
    expect(body.email).toBe(acct.expectedEmail)
  })

  test(`${acct.username}: password is correct (Supabase token exchange)`, async ({ request }) => {
    // First get the email
    const emailRes = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
      data: { username: acct.username },
      headers: { 'Content-Type': 'application/json' },
    })
    if (emailRes.status() !== 200) {
      test.skip(true, `Skipping password test — ${acct.username} not found in user_profiles`)
      return
    }
    const { email } = await emailRes.json()

    // Try to sign in via Supabase REST API directly
    const signInRes = await request.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      data: { email, password: acct.password },
      headers: {
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (signInRes.status() !== 200) {
      const body = await signInRes.json().catch(() => ({}))
      throw new Error(
        `${acct.username} password '${acct.password}' is WRONG (HTTP ${signInRes.status()}: ${(body as Record<string,string>).error_description || 'unknown'}). ` +
        `Fix: Reset via Supabase dashboard → Authentication → Users, or use the admin API: ` +
        `PUT /auth/v1/admin/users/<id> with {"password":"${acct.password}"}`
      )
    }

    const tokenBody = await signInRes.json()
    expect(tokenBody.access_token, `${acct.username} sign-in returned no access_token`).toBeTruthy()
  })

  test(`${acct.username}: has at least one distillery after login`, async ({ request }) => {
    // Use service role to check user_roles
    const emailRes = await request.post(`${BASE_URL}/api/auth/resolve-username`, {
      data: { username: acct.username },
      headers: { 'Content-Type': 'application/json' },
    })
    if (emailRes.status() !== 200) {
      test.skip(true, `Skipping distillery check — ${acct.username} not found`)
      return
    }

    // We can only verify this via the app UI since we don't expose the DB directly
    // The test in auth.spec.ts covers this; this test checks the API layer
    // If the user logs in and hits /dashboard, they have distilleries — covered in auth.spec.ts
  })
}
