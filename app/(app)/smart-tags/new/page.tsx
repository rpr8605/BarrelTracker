import { getActiveDistilleryId, createServiceClient } from '@/lib/supabase-server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createSmartTagAction } from '../actions'

export default async function NewSmartTagPage() {
  const distilleryId = getActiveDistilleryId()
  const admin = createServiceClient()

  // Fetch some entities to link to
  const [{ data: barrels }, { data: batches }] = await Promise.all([
    admin.from('barrels').select('id, barrel_number').eq('distillery_id', distilleryId).limit(20),
    admin.from('batches').select('id, batch_number').eq('distillery_id', distilleryId).limit(20)
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Smart Tag</h1>
        <p className="text-muted-foreground">Link a physical asset to a digital Still record.</p>
      </div>

      <Card className="p-6">
        <form action={createSmartTagAction} className="space-y-6">
          <input type="hidden" name="distillery_id" value={distilleryId} />
          
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tag Technology</label>
            <select name="tag_type" className="w-full bg-muted/50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none" required>
              <option value="qr">QR Code Only</option>
              <option value="hybrid">NFC + QR (Hybrid)</option>
              <option value="nfc">NFC Only</option>
              <option value="uhf">UHF RFID</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Entity Type</label>
            <select name="entity_type" className="w-full bg-muted/50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none" required>
              <option value="barrel">Barrel</option>
              <option value="batch">Batch</option>
              <option value="bottle">Bottle</option>
              <option value="product">Product</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Link to Asset (Optional)</label>
            <select name="entity_id" className="w-full bg-muted/50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none">
              <option value="">-- Create unassigned tag --</option>
              <optgroup label="Recent Barrels">
                {barrels?.map(b => (
                  <option key={b.id} value={b.id}>Barrel #{b.barrel_number}</option>
                ))}
              </optgroup>
              <optgroup label="Recent Batches">
                {batches?.map(b => (
                  <option key={b.id} value={b.id}>Batch #{b.batch_number}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <Button variant="ghost" type="button">Cancel</Button>
            <Button type="submit">Generate Smart Tag</Button>
          </div>
        </form>
      </Card>

      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-2">
        <p className="text-xs font-bold text-primary uppercase tracking-widest italic">Did you know?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Still Smart Tags are immutable doors to your digital records. You can update the data behind the tag at any time without re-printing the label.
        </p>
      </div>
    </div>
  )
}
