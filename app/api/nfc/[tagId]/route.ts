import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(_: NextRequest, { params }: { params: { tagId: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: barrel } = await supabase
    .from('barrels')
    .select('id')
    .eq('nfc_tag_id', params.tagId)
    .single()

  if (!barrel) return NextResponse.redirect(new URL('/barrels/new', process.env.NEXT_PUBLIC_SUPABASE_URL || ''))
  return NextResponse.json({ barrel_id: barrel.id })
}
