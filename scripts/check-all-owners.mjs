const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'
const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

const [profiles, distilleries] = await Promise.all([
  fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,username`, { headers: h }).then(r => r.json()),
  fetch(`${SUPABASE_URL}/rest/v1/distilleries?select=id,name,owner_id`, { headers: h }).then(r => r.json()),
])

const userMap = Object.fromEntries(profiles.map(p => [p.id, p.username]))
userMap['null'] = '(none)'

// Check all owner IDs including unknowns
for (const d of distilleries) {
  const owner = userMap[d.owner_id] || `UNKNOWN(${d.owner_id})`
  console.log(`${d.name}: owner = ${owner} (${d.owner_id})`)
}

// Check if RRUSSELL owns anything
const rrussell = profiles.find(p => p.username === 'RRUSSELL')
console.log('\nRRUSSELL id:', rrussell?.id)
const rrussellOwned = distilleries.filter(d => d.owner_id === rrussell?.id)
console.log('RRUSSELL owns:', rrussellOwned.map(d => d.name))

// Check all users' ownership
console.log('\n=== Ownership per user ===')
for (const prof of profiles) {
  const owned = distilleries.filter(d => d.owner_id === prof.id).map(d => d.name)
  console.log(`  ${prof.username}: ${owned.length ? owned.join(', ') : '(none)'}`)
}
