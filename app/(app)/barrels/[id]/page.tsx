import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { BarrelDetailClient } from './BarrelDetailClient'

export default async function BarrelDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  const [barrelRes, notesRes] = await Promise.all([
    supabase.from('barrels').select('*').eq('id', params.id).single(),
    supabase.from('voice_notes').select('*').eq('barrel_id', params.id).order('recorded_at', { ascending: false }),
  ])

  if (!barrelRes.data) notFound()

  return <BarrelDetailClient barrel={barrelRes.data} notes={notesRes.data || []} />
}
