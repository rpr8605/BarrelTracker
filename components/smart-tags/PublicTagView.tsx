import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AssetTag } from '@/types/database'
import { CheckCircle2, Shield } from 'lucide-react'

interface PublicTagViewProps {
  tag: AssetTag
  entity: any
}

export function PublicTagView({ tag, entity }: PublicTagViewProps) {
  const name = entity?.name || entity?.barrel_number || entity?.batch_number || 'Unnamed Asset'
  const type = tag.assigned_entity_type.charAt(0).toUpperCase() + tag.assigned_entity_type.slice(1)

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="p-6 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <CheckCircle2 size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          <div className="flex justify-center gap-2">
            <Badge label={type} />
            <Badge label="Authentic Record" />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground border-b pb-4">
          <Shield size={18} className="text-primary" />
          <span>Still Smart Tag Verified</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Producer</p>
            <p className="font-medium">Ridgeline Spirits</p>
          </div>
          <div>
            <p className="text-muted-foreground">Asset ID</p>
            <p className="font-medium">{tag.public_slug}</p>
          </div>
          {entity?.spirits_type && (
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{entity.spirits_type.replace('_', ' ')}</p>
            </div>
          )}
          {entity?.entry_date && (
            <div>
              <p className="text-muted-foreground">Logged</p>
              <p className="font-medium">{new Date(entity.entry_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground px-4">
        Still Smart Tags turn physical assets into live digital records. 
        Protected by Still operational transparency.
      </p>
    </div>
  )
}
