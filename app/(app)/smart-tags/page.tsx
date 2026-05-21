import { createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Plus, QrCode, Search, Tag as TagIcon } from 'lucide-react'
import Link from 'next/link'

export default async function SmartTagsListPage() {
  const distilleryId = getActiveDistilleryId()
  const admin = createServiceClient()

  const { data: tags } = await admin
    .from('asset_tags')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Tags</h1>
          <p className="text-muted-foreground">Manage physical-to-digital asset links.</p>
        </div>
        <Link href="/smart-tags/new">
          <Button className="gap-2">
            <Plus size={18} /> New Tag
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none" 
            placeholder="Search tags by ID or slug..."
          />
        </div>
      </div>

      <div className="grid gap-4">
        {!tags || tags.length === 0 ? (
          <Card className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
              <TagIcon size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold">No smart tags yet</h3>
              <p className="text-sm text-muted-foreground">Create your first tag to link it to a barrel or batch.</p>
            </div>
            <Link href="/smart-tags/new">
              <Button variant="secondary" size="sm">Create First Tag</Button>
            </Link>
          </Card>
        ) : (
          tags.map((tag) => (
            <Link key={tag.id} href={`/smart-tags/${tag.id}`}>
              <Card className="p-4 hover:border-primary transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold font-mono">{tag.public_slug}</p>
                      <Badge label={tag.tag_type} className="text-[10px] uppercase" />
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {tag.assigned_entity_type}: {tag.assigned_entity_id ? 'Assigned' : 'Unassigned'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs font-bold">{tag.scan_count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Scans</p>
                  </div>
                  <Badge label={tag.status} className="capitalize w-20 justify-center" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
