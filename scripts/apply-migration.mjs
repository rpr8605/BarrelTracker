/**
 * Apply a migration SQL file directly via Supabase service role.
 * Usage: node scripts/apply-migration.mjs <path-to-sql-file>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const sqlFile = process.argv[2]
if (!sqlFile) {
  console.error('Usage: node scripts/apply-migration.mjs <path-to-sql-file>')
  process.exit(1)
}

const sql = readFileSync(sqlFile, 'utf8')
const supabase = createClient(url, key)

// Split on statement-ending semicolons, skip blank/comment-only chunks
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('--'))

console.log(`Applying ${statements.length} statements from ${sqlFile}…`)

let applied = 0
for (const stmt of statements) {
  const full = stmt + ';'
  const { error } = await supabase.rpc('exec_sql', { query: full }).single().catch(() => ({ error: null }))
  if (error) {
    // Try direct query via pg REST endpoint
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'params=single-object' },
      body: JSON.stringify({ query: full }),
    })
    if (!res.ok) {
      const text = await res.text()
      // Ignore "already exists" errors — idempotent
      if (text.includes('already exists') || text.includes('42701') || text.includes('42P07') || text.includes('42710')) {
        console.log(`  ⚠ Skipped (already exists): ${full.slice(0, 60)}…`)
      } else {
        console.error(`  ✗ Error on: ${full.slice(0, 80)}`)
        console.error(`    ${text.slice(0, 200)}`)
      }
    } else { applied++ }
  } else { applied++ }
}

console.log(`Done — ${applied} statements applied.`)
