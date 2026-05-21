import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AssetTag } from '@/types/database'
import { FileText, Landmark, ShieldCheck } from 'lucide-react'

interface DistributorRegulatorTagViewProps {
  tag: AssetTag
  entity: any
  compliance?: any
}

export function DistributorRegulatorTagView({ tag, entity, compliance }: DistributorRegulatorTagViewProps) {
  const name = entity?.name || entity?.barrel_number || entity?.batch_number || 'Unnamed Asset'
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6 border-l-4 border-l-blue-600 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs">
            <ShieldCheck size={16} />
            <span>Compliance Snapshot</span>
          </div>
          <Badge label="Official Record" />
        </div>
        <h1 className="text-xl font-bold">{name}</h1>
        <p className="text-sm text-muted-foreground">
          Produced and registered by Ridgeline Spirits. 
          Verified Still Smart Tag: <span className="font-mono">{tag.public_slug}</span>
        </p>
      </Card>

      <div className="grid gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold border-b pb-2">
            <Landmark size={18} className="text-primary" />
            <span>Federal Registry</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground uppercase text-[10px] font-bold">TTB COLA Number</p>
              <p className="font-medium">{compliance?.ttb_cola_number || 'Pending'}</p>
            </div>
            <div>
              <p className="text-muted-foreground uppercase text-[10px] font-bold">Registry Status</p>
              <Badge label="APPROVED" className="bg-green-100 text-green-800 border-none" />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold border-b pb-2">
            <FileText size={18} className="text-primary" />
            <span>State Registrations</span>
          </div>
          <div className="space-y-3">
            {[
              { state: 'Missouri', id: 'MO-77382', status: 'Approved' },
              { state: 'Kansas', id: 'KS-99120', status: 'Approved' }
            ].map((reg) => (
              <div key={reg.state} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <div>
                  <p className="font-bold">{reg.state}</p>
                  <p className="text-xs text-muted-foreground">ID: {reg.id}</p>
                </div>
                <Badge label={reg.status} className="text-[10px]" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-xs text-muted-foreground text-center space-y-2">
        <p>This record was generated for regulatory/distribution review on {new Date().toLocaleDateString()}.</p>
        <p>Still provides producer-supplied records and links for verification. Official agency records should be verified through the relevant state/federal systems.</p>
      </div>
    </div>
  )
}
