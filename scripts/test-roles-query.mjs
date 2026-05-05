/**
 * Tests the exact user_roles query used in (app)/layout.tsx
 * to confirm whether the inline join works.
 */

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// Get DFRANCIS's user id from user_profiles
const profRes = await fetch(
  `${SUPABASE_URL}/rest/v1/user_profiles?username=eq.DFRANCIS&select=id`,
  { headers }
)
const [profile] = await profRes.json()
console.log('DFRANCIS user id:', profile?.id)

if (!profile?.id) process.exit(1)

// Test the exact query from (app)/layout.tsx — with inline join
console.log('\n--- With inline join: distilleries(id, name) ---')
const joinRes = await fetch(
  `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${profile.id}&select=role,distillery_id,distilleries(id,name)`,
  { headers }
)
const joinData = await joinRes.json()
console.log('HTTP', joinRes.status)
console.log(JSON.stringify(joinData, null, 2))

// Test without inline join
console.log('\n--- Without inline join ---')
const plainRes = await fetch(
  `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${profile.id}&select=role,distillery_id`,
  { headers }
)
const plainData = await plainRes.json()
console.log('HTTP', plainRes.status)
console.log(JSON.stringify(plainData, null, 2))
