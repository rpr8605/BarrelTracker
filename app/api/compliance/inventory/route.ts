import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { generateAttestationPDF } from '@/lib/ttb/inventory-pdf'
import { calcProofGallons } from '@/lib/ttb'
import { uploadToR2 } from '@/lib/r2'

const PERJURY_STATEMENT = `Under penalties of perjury, I declare that I have examined this inventory, and to the best of my knowledge and belief it is true, correct, and complete as required by 27 CFR Part 19.`

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()

  // ?populate=true: return live barrel snapshot as pre-filled inventory_data
  if (searchParams.get('populate') === 'true') {
    const { data: barrels, error } = await admin
      .from('barrels')
      .select('id,barrel_number,spirits_type,entry_proof,wine_gallons,current_wine_gallons,warehouse_row,warehouse_slot,warehouse_tier,status')
      .eq('distillery_id', distilleryId)
      .in('status', ['aging', 'ready'])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = (barrels ?? []).map((b) => {
      const wg = b.current_wine_gallons ?? b.wine_gallons ?? 0
      const pg = b.entry_proof ? calcProofGallons(wg, b.entry_proof) : 0
      return {
        container_id: b.barrel_number,
        container_type: 'barrel',
        spirit_class: b.spirits_type ?? 'bourbon',
        proof_gallons: pg,
        wine_gallons: wg,
        location: b.warehouse_row ? `Row ${b.warehouse_row} Slot ${b.warehouse_slot} Tier ${b.warehouse_tier}` : '',
        notes: null,
      }
    })

    return NextResponse.json({
      inventory_data: items,
      total_proof_gallons: items.reduce((s, i) => s + i.proof_gallons, 0),
      total_wine_gallons: items.reduce((s, i) => s + i.wine_gallons, 0),
      total_containers: items.length,
    })
  }

  const { data, error } = await admin.from('inventory_attestations').select('*').eq('distillery_id', distilleryId).order('inventory_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    distillery_id, inventory_type, period_label, inventory_date,
    total_proof_gallons, barrel_count, container_count, inventory_data,
    attested_by_name, signed_by_title, attest,
    discrepancy_noted, discrepancy_notes,
  } = body

  if (!distillery_id || !inventory_type || !period_label || !inventory_date || !attested_by_name)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const admin = createServiceClient()

  const { data: distillery } = await admin.from('distilleries').select('name,dsp_number').eq('id', distillery_id).single()

  const signedAt = attest ? new Date().toISOString() : null

  // Compute total_wine_gallons from inventory_data items
  const total_wine_gallons = (inventory_data ?? []).reduce(
    (sum: number, item: { wine_gallons?: number }) => sum + (item.wine_gallons ?? 0), 0
  )

  const { data, error } = await admin.from('inventory_attestations').insert({
    distillery_id, inventory_type, period_label, inventory_date,
    total_proof_gallons: total_proof_gallons ?? 0,
    barrel_count: barrel_count ?? null,
    container_count: container_count ?? null,
    inventory_data: inventory_data ?? [],
    attested_by_name,
    signed_by_title: signed_by_title ?? null,
    perjury_statement: attest ? PERJURY_STATEMENT : null,
    attested_by_user_id: user.id,
    attested_at: signedAt,
    discrepancy_noted: discrepancy_noted ?? false,
    discrepancy_notes: discrepancy_notes ?? null,
    status: attest ? 'attested' : 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (attest && data && distillery) {
    try {
      const pdfBytes = await generateAttestationPDF({
        distillery_name: distillery.name,
        dsp_number: distillery.dsp_number ?? '',
        inventory_type,
        period_label,
        period_end_date: inventory_date,
        items: (inventory_data ?? []) as Parameters<typeof generateAttestationPDF>[0]['items'],
        total_containers: container_count ?? (inventory_data?.length ?? 0),
        total_proof_gallons: total_proof_gallons ?? 0,
        total_wine_gallons,
        signed_by_name: attested_by_name,
        signed_by_title: signed_by_title ?? '',
        signed_at: signedAt!,
        perjury_statement: PERJURY_STATEMENT,
        discrepancy_noted: discrepancy_noted ?? false,
        discrepancy_notes,
      })
      const r2Key = `attestations/${distillery_id}/${inventory_type}-${inventory_date}-${data.id}.pdf`
      const pdfPath = await uploadToR2(r2Key, Buffer.from(pdfBytes), 'application/pdf')
      await admin.from('inventory_attestations').update({ pdf_path: pdfPath, pdf_generated_at: new Date().toISOString() }).eq('id', data.id)
      return NextResponse.json({ ...data, pdf_path: pdfPath, pdf_bytes: Buffer.from(pdfBytes).toString('base64') })
    } catch { /* PDF failure non-blocking */ }
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, attest, signed_by_title, ...rest } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const admin = createServiceClient()
  const updates: Record<string, unknown> = { ...rest }
  if (attest) {
    updates.status = 'attested'
    updates.attested_at = new Date().toISOString()
    updates.attested_by_user_id = user.id
    updates.perjury_statement = PERJURY_STATEMENT
    if (signed_by_title) updates.signed_by_title = signed_by_title
  }
  const { data, error } = await admin.from('inventory_attestations').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
