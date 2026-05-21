import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase-server'
import { fetchTaggedEntity, generateQRCodeSVG } from '@/lib/smart-tags'
import { AssetTag } from '@/types/database'

export default async function SmartTagPrintPage({ params }: { params: { id: string } }) {
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

  // 3. Generate QR SVG
  const qrSvg = await generateQRCodeSVG(tag.tag_url)

  return (
    <div className="bg-white min-h-screen p-8 print:p-0">
      <div className="max-w-[4in] mx-auto border-4 border-black p-6 space-y-6 print:border-none print:w-[4in]">
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">STILL</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest">Smart Barrel Tag</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Asset ID</p>
            <p className="text-xl font-mono font-bold leading-none">{tag.public_slug}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Product/Barrel Name</p>
              <p className="text-lg font-bold leading-tight uppercase border-b border-black/20 pb-1">
                {entity?.barrel_number || entity?.name || 'RIDGELINE RESERVE'}
              </p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Fill Date</p>
              <p className="text-sm font-bold border-b border-black/20 pb-1">{entity?.entry_date || '2026-05-20'}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Entry Proof</p>
              <p className="text-sm font-bold border-b border-black/20 pb-1">{entity?.entry_proof || '114.2'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Mash Bill</p>
              <p className="text-sm font-bold border-b border-black/20 pb-1 truncate">{entity?.mash_bill || '75% Corn, 21% Rye, 4% Malt'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Warehouse</p>
              <p className="text-sm font-bold text-center bg-black text-white p-1">A</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Row</p>
              <p className="text-sm font-bold text-center border-2 border-black p-1">{entity?.warehouse_row || '04'}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase text-muted-foreground">Tier</p>
              <p className="text-sm font-bold text-center border-2 border-black p-1">{entity?.warehouse_tier || '2'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t-2 border-black">
          <div className="flex-1 space-y-3">
            <div className="bg-black/5 border-2 border-dashed border-black/20 p-4 rounded-xl text-center">
              <p className="text-[8px] font-black uppercase tracking-tighter leading-none mb-1">NFC AREA</p>
              <p className="text-[6px] font-bold uppercase leading-tight text-muted-foreground">Place inlay behind<br/>this section</p>
            </div>
            <p className="text-[10px] font-black leading-tight">
              TAP OR SCAN<br/>FOR STILL RECORD
            </p>
          </div>
          <div className="w-24 h-24" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        </div>

        <div className="text-[6px] font-bold text-center text-muted-foreground pt-2">
          STILL SMAR T TAGS · OPERATIONAL TRANSPARENCY · REPRODUCED FROM DIGITAL RECORD
        </div>
      </div>

      <div className="mt-8 text-center print:hidden">
        <button 
          onClick={() => window.print()}
          className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors"
        >
          Print Barrel Tag
        </button>
      </div>
    </div>
  )
}
