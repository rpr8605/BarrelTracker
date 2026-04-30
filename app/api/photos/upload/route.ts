import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { uploadToR2, generatePhotoKey } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('photo') as File | null
  const barrelId = formData.get('barrelId') as string

  if (!file || !barrelId) return NextResponse.json({ error: 'Missing photo or barrelId' }, { status: 400 })

  const key = generatePhotoKey(barrelId, file.name)
  let url: string

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    url = await uploadToR2(key, buffer, file.type || 'image/jpeg')
  } catch {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
  }

  const admin = createServiceClient()
  const { data: barrel } = await admin.from('barrels').select('photos').eq('id', barrelId).single()
  const photos = [...(barrel?.photos || []), url]
  await admin.from('barrels').update({ photos }).eq('id', barrelId)

  return NextResponse.json({ url })
}
