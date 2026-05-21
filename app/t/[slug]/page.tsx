import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { fetchTaggedEntity, recordTagScan } from '@/lib/smart-tags'
import { PublicTagView } from '@/components/smart-tags/PublicTagView'
import { InternalTagView } from '@/components/smart-tags/InternalTagView'
import { DistributorRegulatorTagView } from '@/components/smart-tags/DistributorRegulatorTagView'
import { AssetTag } from '@/types/database'

export default async function SmartTagPublicPage({ params }: { params: { slug: string } }) {
  const admin = createServiceClient()
  const h = headers()
  
  // 1. Fetch Tag
  const { data: tag, error: tagError } = await admin
    .from('asset_tags')
    .select('*')
    .eq('public_slug', params.slug)
    .single()

  if (tagError || !tag) notFound()

  // 2. Determine Permissions
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let isInternal = false
  if (user) {
    const { data: userRole } = await admin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('distillery_id', tag.distillery_id)
      .single()
    
    const { data: isOwner } = await admin
      .from('distilleries')
      .select('id')
      .eq('id', tag.distillery_id)
      .eq('owner_id', user.id)
      .single()

    if (userRole || isOwner) isInternal = true
  }

  // 3. Fetch Entity Data
  const entity = tag.assigned_entity_id 
    ? await fetchTaggedEntity(tag.assigned_entity_type, tag.assigned_entity_id)
    : null

  // 4. Record Scan Event (Async)
  const viewerType = isInternal ? 'internal' : 'public' // simplified for now
  recordTagScan({
    asset_tag_id: tag.id,
    scan_source: (h.get('x-still-scan-source') as any) || 'qr',
    viewer_type: viewerType,
    user_id: user?.id,
    ip_address: h.get('x-forwarded-for') || 'unknown',
    user_agent: h.get('user-agent') || 'unknown',
    referrer: h.get('referer') || 'unknown'
  })

  // 5. Render View
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 flex items-center justify-center">
      {isInternal ? (
        <InternalTagView tag={tag as AssetTag} entity={entity} />
      ) : tag.regulator_view_enabled && h.get('x-still-viewer') === 'regulator' ? (
        <DistributorRegulatorTagView tag={tag as AssetTag} entity={entity} />
      ) : tag.public_enabled ? (
        <PublicTagView tag={tag as AssetTag} entity={entity} />
      ) : (
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">This tag record is not currently public.</p>
        </div>
      )}
    </div>
  )
}
