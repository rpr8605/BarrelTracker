/**
 * Apply a SQL migration file to Supabase Postgres via the SQL-over-HTTPS
 * "pg-meta" endpoint that Supabase Studio uses internally. Service role auth.
 *
 * The endpoint accepts the entire file as a single query string, so we do
 * not need to split on semicolons — DO blocks and PL/pgSQL bodies work fine.
 *
 * Usage: node scripts/run-migration.mjs <path-to-sql-file>
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const PROJECT_REF = 'xhifzhnxngrnpnnadwrv'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <path>')
  process.exit(2)
}

const sql = readFileSync(resolve(file), 'utf8')

// Try the pg-meta query endpoint (project-internal, used by Studio).
const endpoints = [
  `${SUPABASE_URL}/pg/query`,
  `${SUPABASE_URL}/pg-meta/default/query`,
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
]

let lastErr = ''
for (const url of endpoints) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })
  if (r.ok) {
    console.log(`✓ applied via ${url}`)
    process.exit(0)
  }
  lastErr = `${url} → ${r.status} ${(await r.text()).slice(0, 300)}`
  console.log(lastErr)
}
console.error(`\n✗ all endpoints failed. Last: ${lastErr}`)
process.exit(1)
