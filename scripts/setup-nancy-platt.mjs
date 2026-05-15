/**
 * Consolidates the Nancy Platt admin account.
 *
 *  - Deletes the empty auth stub at nancy.platt@stilldistillery.app
 *    (created by a previous run before we discovered NPLATT exists).
 *  - Renames the existing NPLATT user to nancy.platt@stilldistillery.app,
 *    sets a known password, and updates display name to "Nancy Platt".
 *  - Ensures her roles match Ryan exactly (super admin + the same
 *    full_access roles on every distillery Ryan can access).
 *  - Logs in as Nancy to confirm credentials work.
 *
 * Run: node scripts/setup-nancy-platt.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'
const ANON_KEY = 'sb_publishable_hFMZFJMSiFzjK0Ad_OLvrg_6CFba1LH'

const NANCY_EMAIL = 'nancy.platt@stilldistillery.app'
const NANCY_PASSWORD = 'NancyPlatt2026!'
const NANCY_USERNAME = 'NPLATT'
const NANCY_DISPLAY = 'Nancy Platt'

const RYAN_ID = 'd06a5ce3-283e-4f2f-89f7-208925eb6020'
const EXISTING_NPLATT_ID = '9fc451b7-e64b-4c7c-9525-6adc8f8251cc'
const STUB_ID = '414ac083-4833-4fc5-ac5c-382f10bd6e09'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function deleteStub() {
  const { data } = await admin.auth.admin.getUserById(STUB_ID)
  if (!data?.user) {
    console.log('  no stub to delete')
    return
  }
  const { error } = await admin.auth.admin.deleteUser(STUB_ID)
  if (error) throw new Error(`deleteUser stub: ${error.message}`)
  console.log(`  deleted stub ${STUB_ID}`)
}

async function updateNancyAuth() {
  const { error } = await admin.auth.admin.updateUserById(EXISTING_NPLATT_ID, {
    email: NANCY_EMAIL,
    password: NANCY_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: NANCY_DISPLAY, username: NANCY_USERNAME },
  })
  if (error) throw new Error(`updateUserById nancy: ${error.message}`)
}

async function updateNancyProfile() {
  const { error } = await admin
    .from('user_profiles')
    .upsert(
      {
        id: EXISTING_NPLATT_ID,
        username: NANCY_USERNAME,
        display_name: NANCY_DISPLAY,
        is_super_admin: true,
      },
      { onConflict: 'id' },
    )
  if (error) throw new Error(`user_profiles upsert: ${error.message}`)
}

async function syncRolesFromRyan() {
  const { data: ryanRoles, error } = await admin
    .from('user_roles')
    .select('distillery_id, role')
    .eq('user_id', RYAN_ID)
  if (error) throw new Error(`select ryan roles: ${error.message}`)

  for (const r of ryanRoles ?? []) {
    const { error: upErr } = await admin
      .from('user_roles')
      .upsert(
        { user_id: EXISTING_NPLATT_ID, distillery_id: r.distillery_id, role: r.role },
        { onConflict: 'user_id,distillery_id' },
      )
    if (upErr) throw new Error(`upsert role ${r.distillery_id}: ${upErr.message}`)
  }
  return (ryanRoles ?? []).length
}

async function testLogin() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: NANCY_EMAIL, password: NANCY_PASSWORD }),
  })
  const body = await r.json()
  return { ok: r.ok, status: r.status, body }
}

async function main() {
  console.log('=== Nancy Platt admin setup ===\n')

  console.log('1. Deleting accidental nancy.platt stub auth user...')
  await deleteStub()

  console.log('\n2. Renaming existing NPLATT to nancy.platt@stilldistillery.app...')
  await updateNancyAuth()
  console.log('  auth user updated')

  console.log('\n3. Updating profile (Nancy Platt, super admin)...')
  await updateNancyProfile()
  console.log('  profile updated')

  console.log('\n4. Mirroring Ryan’s distillery roles...')
  const n = await syncRolesFromRyan()
  console.log(`  ${n} role(s) ensured`)

  console.log('\n5. Testing login...')
  const login = await testLogin()
  if (!login.ok) {
    console.error(`  ✗ login failed: ${login.status} ${JSON.stringify(login.body)}`)
    process.exit(1)
  }
  console.log(`  ✓ password sign-in ok (expires_in=${login.body.expires_in}s)`)

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, username, display_name, is_super_admin')
    .eq('id', EXISTING_NPLATT_ID)
    .single()
  const { data: roles } = await admin
    .from('user_roles')
    .select('role, distilleries(name)')
    .eq('user_id', EXISTING_NPLATT_ID)
  const { data: auth } = await admin.auth.admin.getUserById(EXISTING_NPLATT_ID)

  console.log('\n=== Final state ===')
  console.log(`  ${profile.display_name} (${profile.username})`)
  console.log(`  email:           ${auth.user.email}`)
  console.log(`  email_confirmed: ${!!auth.user.email_confirmed_at}`)
  console.log(`  is_super_admin:  ${profile.is_super_admin}`)
  for (const r of roles ?? []) {
    console.log(`  • ${r.distilleries?.name ?? '?'} — ${r.role}`)
  }

  console.log('\n=== Credentials ===')
  console.log(`  Email:    ${NANCY_EMAIL}`)
  console.log(`  Password: ${NANCY_PASSWORD}`)
  console.log(`  Username: ${NANCY_USERNAME}`)
  console.log('\n✓ Done.')
}

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})
