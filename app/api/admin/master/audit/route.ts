import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { adminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const userId = searchParams.get('userId')
  const offset = (page - 1) * limit

  const db = adminClient()
  let query = db
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (userId) query = query.eq('target_user_id', userId)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: data, total: count, page })
}
