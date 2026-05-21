import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import { fetchTaggedEntity } from '@/lib/smart-tags'
import { InternalTagView } from '@/components/smart-tags/InternalTagView'
import { AssetTag } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Landmark, FileText, ClipboardList } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export default async function SmartTagDetailPage({ params }: { params: { id: string } }) {
  const admin = createServiceClient()
  
  // 1. Fetch Tag
  const { data: tag, error } = await admin
    .from('asset_tags')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !tag) notFound()

  // 2. Fetch Entity
  const entity = tag.assigned_entity_id 
    ? await fetchTaggedEntity(tag.assigned_entity_type, tag.assigned_entity_id)
    : null

  // 3. Fetch Audit Logs
  const { data: auditLogs } = await admin
    .from('tag_audit_events')
    .select('*')
    .eq('asset_tag_id', tag.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <InternalTagView tag={tag as AssetTag} entity={entity} />

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2 font-bold">
              <Landmark size={18} className="text-primary" />
              <span>Compliance & Registry</span>
            </div>
            <Button variant="secondary" size="sm">Manage Records</Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span>TTB COLA</span>
              </div>
              <Badge label="Missing" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <span>State Registration (MO)</span>
              </div>
              <Badge label="Missing" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-bold border-b pb-4">
            <ClipboardList size={18} className="text-primary" />
            <span>Audit Trail</span>
          </div>
          
          <div className="space-y-4">
            {!auditLogs || auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No audit events recorded.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs border-b border-muted/50 pb-2 last:border-none">
                  <div className="w-20 shrink-0 text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground capitalize">{log.event_type.replace('_', ' ')}</p>
                    <p className="text-muted-foreground">{log.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
