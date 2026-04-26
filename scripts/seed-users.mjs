/**
 * Creates the 4 Still app users and the Francis Distillery.
 * Run once: node scripts/seed-users.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'
const TEMP_PASSWORD = 'Still2024!'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const USERS = [
  { email: 'william.francis@francisdistillery.com', username: 'WFRANCIS', display_name: 'William Francis', role: 'owner' },
  { email: 'danielle.francis@francisdistillery.com', username: 'DFRANCIS', display_name: 'Danielle Francis', role: 'full_access' },
  { email: 'ryan.russell@francisdistillery.com', username: 'RRUSSELL', display_name: 'Ryan Russell', role: 'full_access' },
  { email: 'gareth.ash@francisdistillery.com', username: 'GASH', display_name: 'Gareth Ash', role: 'read_only' },
]

async function run() {
  const created = {}

  for (const u of USERS) {
    process.stdout.write(`Creating ${u.username}... `)

    // Check if user already exists
    const { data: existing } = await supabase.auth.admin.listUsers()
    const found = existing?.users?.find(x => x.email === u.email)

    let userId
    if (found) {
      console.log(`already exists (${found.id})`)
      userId = found.id
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: u.display_name, username: u.username },
      })
      if (error) { console.error('FAILED:', error.message); continue }
      userId = data.user.id
      console.log(`created (${userId})`)
    }

    created[u.username] = { id: userId, ...u }

    // Upsert profile
    await supabase.from('user_profiles').upsert({
      id: userId,
      username: u.username,
      display_name: u.display_name,
    }, { onConflict: 'id' })
  }

  // Create or find the Francis Distillery (owned by William)
  const william = created['WFRANCIS']
  if (!william) { console.error('William not created — aborting'); process.exit(1) }

  process.stdout.write('Setting up Francis Distillery... ')
  const { data: existing } = await supabase.from('distilleries').select('id').eq('owner_id', william.id).limit(1).single()

  let distilleryId
  if (existing) {
    distilleryId = existing.id
    console.log(`already exists (${distilleryId})`)
  } else {
    const { data, error } = await supabase.from('distilleries').insert({
      name: 'Francis Distillery',
      location: null,
      owner_id: william.id,
    }).select('id').single()
    if (error) { console.error('FAILED:', error.message); process.exit(1) }
    distilleryId = data.id
    console.log(`created (${distilleryId})`)
  }

  // Create taste profile for William if not exists
  await supabase.from('taste_profile').upsert({
    user_id: william.id,
    grain_scores: {},
    flavor_scores: {},
    aging_sweet_spot_months: { min: 24, max: 36 },
    total_tastings: 0,
  }, { onConflict: 'user_id' })

  // Assign roles for non-owner users
  for (const u of USERS) {
    if (u.role === 'owner') continue
    const user = created[u.username]
    if (!user) continue

    process.stdout.write(`Assigning ${u.role} to ${u.username}... `)
    const { error } = await supabase.from('user_roles').upsert({
      user_id: user.id,
      distillery_id: distilleryId,
      role: u.role,
    }, { onConflict: 'user_id,distillery_id' })

    if (error) console.error('FAILED:', error.message)
    else console.log('done')
  }

  console.log('\n=== Users Ready ===')
  console.log(`Distillery: Francis Distillery (${distilleryId})`)
  console.log(`Temp password: ${TEMP_PASSWORD}`)
  console.log('')
  for (const u of USERS) {
    if (!created[u.username]) continue
    console.log(`${u.username} — ${u.email} — ${u.role}`)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
