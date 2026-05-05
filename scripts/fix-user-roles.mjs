/**
 * fix-user-roles.mjs
 * Ensures all named app users have full_access roles for every distillery.
 * Run once: node scripts/fix-user-roles.mjs
 */

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function query(path, method = 'GET', body = null) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return { status: res.status, data: JSON.parse(text) } }
  catch { return { status: res.status, data: text } }
}

const USERNAMES = ['RRUSSELL', 'DFRANCIS', 'WFRANCIS', 'GASH', 'NPLATT']
const DISTILLERY_NAMES = ['Francis Distillery', 'Magnolia Barrel House', 'Demo Distillery']

// WFRANCIS should own Francis Distillery
const OWNERS = {
  WFRANCIS: 'Francis Distillery',
}

async function main() {
  console.log('=== Fixing user_roles ===\n')

  // 1. Fetch all user_profiles
  const { data: profiles } = await query('/user_profiles?select=id,username')
  const profileMap = {}
  for (const p of profiles) profileMap[p.username] = p.id
  console.log('Profiles found:', Object.keys(profileMap))

  const missing = USERNAMES.filter(u => !profileMap[u])
  if (missing.length) {
    console.error('MISSING user_profiles for:', missing)
    console.error('Run the user-creation SQL first.')
    process.exit(1)
  }

  // 2. Fetch all distilleries
  const { data: distilleries } = await query('/distilleries?select=id,name,owner_id')
  const distMap = {}
  for (const d of distilleries) distMap[d.name] = d
  console.log('Distilleries found:', Object.keys(distMap))

  const missingDist = DISTILLERY_NAMES.filter(n => !distMap[n])
  if (missingDist.length) {
    console.error('MISSING distilleries:', missingDist)
    console.error('Run the schema + seed SQL first.')
    process.exit(1)
  }

  // 3. Set owner_id for WFRANCIS → Francis Distillery (if not already set)
  const wfrancisId = profileMap['WFRANCIS']
  const francisDist = distMap['Francis Distillery']
  if (francisDist.owner_id !== wfrancisId) {
    console.log(`\nSetting WFRANCIS (${wfrancisId}) as owner of Francis Distillery...`)
    const { status } = await query(
      `/distilleries?id=eq.${francisDist.id}`,
      'PATCH',
      { owner_id: wfrancisId }
    )
    console.log(status === 200 || status === 204 ? '  ✓ Done' : `  ✗ Failed (HTTP ${status})`)
  } else {
    console.log('\nWFRANCIS already owns Francis Distillery ✓')
  }

  // 4. Upsert user_roles for every user × every distillery
  console.log('\nUpserting user_roles...')
  const rows = []
  for (const username of USERNAMES) {
    const userId = profileMap[username]
    for (const distName of DISTILLERY_NAMES) {
      const dist = distMap[distName]
      rows.push({ user_id: userId, distillery_id: dist.id, role: 'full_access' })
    }
  }

  // Upsert in one call (on conflict do nothing)
  const { status, data } = await query(
    '/user_roles',
    'POST',
    rows
  )

  // Try upsert with prefer header
  const upsertHeaders = {
    ...headers,
    Prefer: 'resolution=ignore-duplicates,return=representation',
  }
  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
    method: 'POST',
    headers: upsertHeaders,
    body: JSON.stringify(rows),
  })
  const upsertData = await upsertRes.json().catch(() => null)
  console.log(`  HTTP ${upsertRes.status}`)
  if (upsertRes.status === 201 || upsertRes.status === 200) {
    const count = Array.isArray(upsertData) ? upsertData.length : '?'
    console.log(`  ✓ ${count} rows processed (new or already existed)`)
  } else {
    console.error('  ✗ Error:', JSON.stringify(upsertData, null, 2))
  }

  // 5. Verify
  console.log('\n=== Verification ===')
  for (const username of USERNAMES) {
    const userId = profileMap[username]
    const { data: roles } = await query(
      `/user_roles?user_id=eq.${userId}&select=distillery_id,distilleries(name)`
    )
    const names = (roles || []).map(r => r.distilleries?.name || r.distillery_id)
    const owned = Object.values(distMap)
      .filter(d => d.owner_id === userId)
      .map(d => d.name + ' (owner)')
    const allAccess = [...new Set([...names, ...owned])]
    const ok = DISTILLERY_NAMES.every(n => allAccess.some(a => a.includes(n)))
    console.log(`  ${ok ? '✓' : '✗'} ${username}: ${allAccess.join(', ') || 'NONE'}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
