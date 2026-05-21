import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons, spiritsLabel } from '@/lib/ttb'
import { monthlyReportDueDate } from '@/lib/ttb/business-days'

// Generates pre-filled TTB form data for 5110.40, 5110.11, 5110.28
// These are not official TTB submissions — they pre-populate numbers
// the operator enters into TTB Online / Pay.gov

export async function GET(req: NextRequest, { params }: { params: { form: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  const period = searchParams.get('period') // YYYY-MM-DD (first of month)
  if (!distilleryId || !period) return NextResponse.json({ error: 'Missing distillery_id or period' }, { status: 400 })

  const form = params.form
  const periodStart = new Date(period)
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59)
  const prevPeriodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, 1)

  const startISO = periodStart.toISOString().split('T')[0]
  const endISO = periodEnd.toISOString().split('T')[0]
  const prevStartISO = prevPeriodStart.toISOString().split('T')[0]

  const admin = createServiceClient()
  const { data: distillery } = await admin.from('distilleries').select('name,dsp_number').eq('id', distilleryId).single()

  const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dueDate = monthlyReportDueDate(periodStart.getFullYear(), periodStart.getMonth() + 1)
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (form === '5110-11') {
    // Form 5110.11 — Monthly Report of Storage Operations
    const [snapshotsRes, prevSnapshotsRes, barrelsRes] = await Promise.all([
      admin.from('compliance_snapshots').select('*').eq('distillery_id', distilleryId).eq('period', startISO),
      admin.from('compliance_snapshots').select('*').eq('distillery_id', distilleryId).eq('period', prevStartISO),
      admin.from('barrels').select('id,barrel_number,spirits_type,current_wine_gallons,wine_gallons,entry_proof,status,warehouse_row,warehouse_slot,warehouse_tier,cooperage_code')
        .eq('distillery_id', distilleryId).neq('status', 'dumped'),
    ])

    const snapshots = snapshotsRes.data ?? []
    const prevSnapshots = prevSnapshotsRes.data ?? []
    const barrels = barrelsRes.data ?? []

    const barrelSummary = barrels.map((b) => ({
      package_id: b.barrel_number,
      spirits_type: b.spirits_type ?? 'bourbon',
      cooperage_code: b.cooperage_code ?? 'C',
      current_wine_gallons: b.current_wine_gallons ?? b.wine_gallons ?? 0,
      proof_gallons: b.entry_proof ? calcProofGallons(b.current_wine_gallons ?? b.wine_gallons ?? 0, b.entry_proof) : 0,
      location: b.warehouse_row ? `Row ${b.warehouse_row} Slot ${b.warehouse_slot} Tier ${b.warehouse_tier}` : '',
      status: b.status,
    }))

    // account_transfers into storage this month
    const { data: inboundTransfers } = await admin.from('account_transfers')
      .select('spirits_type,proof_gallons').eq('distillery_id', distilleryId)
      .eq('to_account', 'storage').gte('transfer_date', startISO).lte('transfer_date', endISO)

    const { data: outboundTransfers } = await admin.from('account_transfers')
      .select('spirits_type,proof_gallons').eq('distillery_id', distilleryId)
      .eq('from_account', 'storage').gte('transfer_date', startISO).lte('transfer_date', endISO)

    const inboundByType: Record<string, number> = {}
    for (const t of inboundTransfers ?? []) {
      inboundByType[t.spirits_type] = (inboundByType[t.spirits_type] ?? 0) + (t.proof_gallons ?? 0)
    }
    const outboundByType: Record<string, number> = {}
    for (const t of outboundTransfers ?? []) {
      outboundByType[t.spirits_type] = (outboundByType[t.spirits_type] ?? 0) + (t.proof_gallons ?? 0)
    }

    return NextResponse.json({
      form: '5110.11',
      title: 'Monthly Report of Storage Operations',
      period: periodLabel,
      due_date: dueDate,
      distillery_name: distillery?.name ?? '',
      dsp_number: distillery?.dsp_number ?? '',
      generated_at: new Date().toISOString(),
      spirits_accounts: snapshots.map((snap) => {
        const prev = prevSnapshots.find((p) => p.spirits_type === snap.spirits_type)
        return {
          spirits_type: snap.spirits_type,
          spirits_type_label: spiritsLabel(snap.spirits_type),
          line_1_beginning_proof_gallons: snap.beg_proof_gallons,
          line_2_received_from_production: inboundByType[snap.spirits_type] ?? 0,
          line_3_received_tib: 0,
          line_4_total_on_hand: snap.beg_proof_gallons + (inboundByType[snap.spirits_type] ?? 0),
          line_5_transferred_to_processing: outboundByType[snap.spirits_type] ?? 0,
          line_6_transferred_tib: 0,
          line_7_losses_angels_share: 0,
          line_8_other_removals: 0,
          line_9_total_removed: outboundByType[snap.spirits_type] ?? 0,
          line_10_ending_proof_gallons: snap.end_proof_gallons,
          reconciliation_check: Math.abs(snap.discrepancy_wine_gallons) < 0.01 ? 'BALANCED' : `VARIANCE: ${snap.discrepancy_wine_gallons.toFixed(2)} WG`,
          prior_month_ending: prev?.end_proof_gallons ?? null,
          continuity_check: prev
            ? (Math.abs(snap.beg_proof_gallons - prev.end_proof_gallons) < 0.01 ? 'OK' : 'MISMATCH — investigate before filing')
            : 'No prior period data',
        }
      }),
      barrel_package_summary: barrelSummary,
      total_barrels: barrels.length,
      total_proof_gallons_on_hand: barrelSummary.reduce((s, b) => s + b.proof_gallons, 0),
      zero_activity: snapshots.length === 0,
    })
  }

  if (form === '5110-40') {
    // Form 5110.40 — Monthly Report of Production Operations
    const [mashRes, fermRes, distRes, transfersRes] = await Promise.all([
      admin.from('mash_batches').select('*').eq('distillery_id', distilleryId)
        .gte('mash_date', startISO).lte('mash_date', endISO),
      admin.from('fermentation_logs').select('*').eq('distillery_id', distilleryId)
        .gte('start_date', startISO).lte('start_date', endISO),
      admin.from('distillation_logs').select('*').eq('distillery_id', distilleryId)
        .gte('distillation_date', startISO).lte('distillation_date', endISO),
      admin.from('account_transfers').select('*').eq('distillery_id', distilleryId)
        .eq('from_account', 'production').gte('transfer_date', startISO).lte('transfer_date', endISO),
    ])

    const mash = mashRes.data ?? []
    const ferm = fermRes.data ?? []
    const dist = distRes.data ?? []
    const transfers = transfersRes.data ?? []

    const producedPG = dist.reduce((s, d) => s + (d.spirits_produced_proof_gallons ?? 0), 0)
    const transferredPG = transfers.reduce((s, t) => s + (t.proof_gallons ?? 0), 0)

    const byType: Record<string, number> = {}
    for (const d of dist) {
      const t = d.spirits_type ?? 'bourbon'
      byType[t] = (byType[t] ?? 0) + (d.spirits_produced_proof_gallons ?? 0)
    }

    const totalGrainLbs = mash.reduce((s, m) => s + (m.total_grain_lbs ?? 0), 0)

    return NextResponse.json({
      form: '5110.40',
      title: 'Monthly Report of Production Operations',
      period: periodLabel,
      due_date: dueDate,
      distillery_name: distillery?.name ?? '',
      dsp_number: distillery?.dsp_number ?? '',
      generated_at: new Date().toISOString(),
      line_1_mash_batches: mash.length,
      line_1a_total_grain_lbs: totalGrainLbs,
      line_2_fermentations_started: ferm.length,
      line_3_distillation_runs: dist.length,
      line_4_produced_by_type: Object.entries(byType).map(([spirits_type, proof_gallons]) => ({
        spirits_type, label: spiritsLabel(spirits_type), proof_gallons,
      })),
      line_5_total_produced_proof_gallons: producedPG,
      line_6_transferred_to_storage_proof_gallons: transferredPG,
      line_7_production_losses_proof_gallons: 0,
      line_8_losses_detail: [],
      line_9_ending_production_account: producedPG - transferredPG,
      raw_records: {
        mash_batches: mash,
        fermentation_logs: ferm,
        distillation_logs: dist,
        transfers_to_storage: transfers,
      },
      zero_activity: mash.length === 0 && dist.length === 0,
    })
  }

  if (form === '5110-28') {
    // Form 5110.28 — Monthly Report of Processing Operations
    const [bottlingRes, remnantsRes, leakersRes, taxRemovalsRes, inboundRes] = await Promise.all([
      admin.from('bottling_records').select('*').eq('distillery_id', distilleryId)
        .gte('bottling_date', startISO).lte('bottling_date', endISO),
      admin.from('remnant_area_log').select('*').eq('distillery_id', distilleryId)
        .gte('log_date', startISO).lte('log_date', endISO),
      admin.from('leaker_area_log').select('*').eq('distillery_id', distilleryId)
        .gte('log_date', startISO).lte('log_date', endISO),
      admin.from('tax_determined_removals').select('*').eq('distillery_id', distilleryId)
        .gte('removal_date', startISO).lte('removal_date', endISO),
      admin.from('account_transfers').select('*').eq('distillery_id', distilleryId)
        .eq('to_account', 'processing').gte('transfer_date', startISO).lte('transfer_date', endISO),
    ])

    const bottlingRecs = bottlingRes.data ?? []
    const remnants = remnantsRes.data ?? []
    const leaks = leakersRes.data ?? []
    const taxRemovals = taxRemovalsRes.data ?? []
    const inbound = inboundRes.data ?? []

    const receivedPG = inbound.reduce((s, t) => s + (t.proof_gallons ?? 0), 0)
    const bottledPG = bottlingRecs.reduce((s, b) => s + (b.proof_gallons ?? 0), 0)
    const removalsPG = taxRemovals.reduce((s, r) => s + (r.proof_gallons ?? 0), 0)
    const leakerLossPG = leaks.reduce((s, l) => s + (l.estimated_proof_gallons_lost ?? 0), 0)
    const remnantPG = remnants.reduce((s, r) => s + (r.estimated_proof_gallons ?? 0), 0)
    const totalBottles = bottlingRecs.reduce((s, b) => s + (b.cases_bottled * b.bottles_per_case), 0)
    const totalCases = bottlingRecs.reduce((s, b) => s + b.cases_bottled, 0)

    return NextResponse.json({
      form: '5110.28',
      title: 'Monthly Report of Processing Operations',
      period: periodLabel,
      due_date: dueDate,
      distillery_name: distillery?.name ?? '',
      dsp_number: distillery?.dsp_number ?? '',
      generated_at: new Date().toISOString(),
      line_1_received_from_storage_proof_gallons: receivedPG,
      line_2_bottled_proof_gallons: bottledPG,
      line_3_total_bottles: totalBottles,
      line_4_total_cases: totalCases,
      line_5_tax_determined_removals_proof_gallons: removalsPG,
      line_6_removal_detail: taxRemovals.map((r) => ({
        removal_date: r.removal_date,
        product_name: r.product_name,
        destination: r.destination,
        proof_gallons: r.proof_gallons,
        tax_owed: r.tax_owed,
        cbma_rate: r.cbma_rate_applied,
      })),
      line_7_losses_breakage_leakers_proof_gallons: leakerLossPG,
      line_8_remnant_records: remnants.length,
      line_8a_remnant_proof_gallons: remnantPG,
      line_9_leaker_records: leaks.length,
      line_10_ending_processing_account: receivedPG - bottledPG - removalsPG - leakerLossPG,
      bottling_summary: bottlingRecs.map((b) => ({
        product_name: b.product_name, spirits_type: b.spirits_type,
        proof: b.proof, bottles: b.cases_bottled * b.bottles_per_case,
        bottle_size_ml: b.bottle_size_ml, cases: b.cases_bottled,
        proof_gallons: b.proof_gallons, bottling_date: b.bottling_date,
        lot_number: b.lot_number,
      })),
      zero_activity: bottlingRecs.length === 0 && taxRemovals.length === 0,
    })
  }

  return NextResponse.json({ error: `Unknown form: ${form}. Use 5110-11, 5110-40, or 5110-28` }, { status: 400 })
}
