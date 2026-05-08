import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getPresignedUrl } from '@/lib/r2'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('inventory_attestations')
    .select('distillery_id,pdf_path')
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify ownership
  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', data.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!data.pdf_path) return NextResponse.json({ error: 'No PDF generated for this attestation' }, { status: 404 })

  // If R2 key pattern (attestations/...), generate presigned URL; otherwise redirect directly
  const key = data.pdf_path.includes('attestations/') ? data.pdf_path.split('/').slice(-3).join('/').replace('attestations/', '') : null
  if (key) {
    const r2Key = `attestations/${key}`
    const url = await getPresignedUrl(r2Key, 3600)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(data.pdf_path)
}
