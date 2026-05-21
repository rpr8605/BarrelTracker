'use server'

import { createAssetTag } from '@/lib/smart-tags'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSmartTagAction(formData: FormData) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const distilleryId = formData.get('distillery_id') as string
  const tagType = formData.get('tag_type') as any
  const entityType = formData.get('entity_type') as any
  const entityId = formData.get('entity_id') as string

  const tag = await createAssetTag({
    distillery_id: distilleryId,
    tag_type: tagType,
    assigned_entity_type: entityType,
    assigned_entity_id: entityId || undefined,
    created_by: user.id
  })

  revalidatePath('/smart-tags')
  redirect(`/smart-tags/${tag.id}`)
}
