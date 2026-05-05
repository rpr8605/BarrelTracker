const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'
const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }

const [profiles, distilleries] = await Promise.all([
  fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,username`, { headers: h }).then(r => r.json()),
  fetch(`${SUPABASE_URL}/rest/v1/distilleries?select=id,name,owner_id`, { headers: h }).then(r => r.json()),
])

const userMap = Object.fromEntries(profiles.map(p => [p.id, p.username]))

console.log('=== Distillery Ownership ===')
for (const d of distilleries) {
  const owner = userMap[d.owner_id] || d.owner_id || '(none)'
  console.log(`  ${d.name}: owner = ${owner}`)
}

console.log('\n=== distillery/switch logic simulation for each user ===')
for (const prof of profiles) {
  const username = prof.username
  const userId = prof.id

  // getMyDistilleryId: first check ownership
  const ownedDist = distilleries.find(d => d.owner_id === userId)

  // then first user_role
  const rolesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=distillery_id&limit=1`,
    { headers: h }
  )
  const roles = await rolesRes.json()
  const myId = ownedDist?.id ?? roles[0]?.distillery_id ?? null

  const francisId = distilleries.find(d => d.name === 'Francis Distillery')?.id
  const isOwned = myId === francisId

  const roleCheckRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&distillery_id=eq.${francisId}&select=distillery_id`,
    { headers: h }
  )
  const roleCheck = (await roleCheckRes.json())[0] ?? null

  const wouldGetCookie = isOwned || !!roleCheck
  console.log(`  ${username}: myId=${myId?.slice(0,8)}.. isOwned=${isOwned} roleCheck=${!!roleCheck} → switch ${wouldGetCookie ? '✓ ALLOWED' : '✗ 403'}`)
}
