import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { BarrelDetailClient } from './BarrelDetailClient'
import { trackServerEvent } from '@/lib/posthog-server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function BarrelDetailPage({ params }: { params: { id: string } }) {
  const admin = createServiceClient()
  const supabase = createServerSupabaseClient()

  const [barrelRes, notesRes, { data: { user } }] = await Promise.all([
    admin.from('barrels').select('*').eq('id', params.id).single(),
    admin.from('voice_notes').select('*').eq('barrel_id', params.id).order('recorded_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  if (!barrelRes.data) notFound()

  if (user) {
    await trackServerEvent(user.id, 'barrel_viewed', {
      barrel_id: barrelRes.data.id,
      distillery_id: barrelRes.data.distillery_id,
    })
  }

  return <BarrelDetailClient barrel={barrelRes.data} notes={notesRes.data || []} />
}
