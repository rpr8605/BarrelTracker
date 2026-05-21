import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AssetTag } from '@/types/database'
import { ExternalLink, History, Info, MapPin, QrCode, Tag as TagIcon } from 'lucide-react'
import Link from 'next/link'

interface InternalTagViewProps {
  tag: AssetTag
  entity: any
}

export function InternalTagView({ tag, entity }: InternalTagViewProps) {
  const name = entity?.name || entity?.barrel_number || entity?.batch_number || 'Unnamed Asset'
  const type = tag.assigned_entity_type

  const getEntityLink = () => {
    switch (type) {
      case 'barrel': return `/barrels/${entity.id}`
      case 'batch': return `/batches/${entity.id}`
      default: return '#'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <TagIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tag.public_slug}</h1>
            <p className="text-sm text-muted-foreground capitalize">Internal {type} Control</p>
          </div>
        </div>
        <Badge label={tag.status} className="capitalize" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <Info size={18} className="text-primary" />
              <span>Assigned Record</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-bold">{name}</p>
                <p className="text-xs text-muted-foreground capitalize">{type} Record</p>
              </div>
              <Link href={getEntityLink()}>
                <Button variant="ghost" size="sm" className="gap-2">
                  View Full Record <ExternalLink size={14} />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tag Type</p>
                <p className="font-medium uppercase">{tag.tag_type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scan Count</p>
                <p className="font-medium">{tag.scan_count}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                <p className="font-medium">{new Date(tag.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Scan</p>
                <p className="font-medium">{tag.last_scanned_at ? new Date(tag.last_scanned_at).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <History size={18} className="text-primary" />
              <span>Audit History</span>
            </div>
            <p className="text-sm text-muted-foreground italic">Tag-specific audit events will appear here.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4 flex flex-col items-center text-center">
            <div className="bg-white p-2 rounded-lg border">
              <QrCode size={120} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Smart QR</p>
              <p className="text-xs text-muted-foreground">{tag.tag_url}</p>
            </div>
            <Link href={`/smart-tags/${tag.id}/print`} className="w-full">
              <Button className="w-full gap-2">Print Label</Button>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin size={18} className="text-primary" />
              <span>Location Context</span>
            </div>
            <p className="text-sm">
              {entity?.warehouse_row ? `Row ${entity.warehouse_row}, Slot ${entity.warehouse_slot}` : 'No location specified'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
