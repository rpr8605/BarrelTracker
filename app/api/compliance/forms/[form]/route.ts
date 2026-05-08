import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons, spiritsLabel } from '@/lib/ttb'

// Generates pre-filled TTB form data for 5110.40, 5110.11, 5110.28
// These are not official TTB submissions — they pre-populate the numbers
// the operator then enters into TTB Online / Pay.gov

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

  const admin = createServiceClient()

  // Distillery info
  const { data: distillery } = await admin.from('distilleries').select('name,dsp_number').eq('id', distilleryId).single()

  if (form === '5110-11') {
    // Form 5110.11 — Monthly Report of Storage Operations
    // Sources: compliance_snapshots (primary), barrel_events

    const [snapshotsRes, prevSnapshotsRes, barrelsRes] = await Promise.all([
      admin.from('compliance_snapshots').select('*').eq('distillery_id', distilleryId).eq('period', period),
      admin.from('compliance_snapshots').select('*').eq('distillery_id', distilleryId).eq('period', prevPeriodStart.toISOString().split('T')[0]),
      admin.from('barrels').select('id,barrel_number,spirits_type,current_wine_gallons,wine_gallons,entry_proof,status,warehouse_row,warehouse_slot,warehouse_tier,cooperage_code').eq('distillery_id', distilleryId).neq('status', 'dumped'),
    ])

    const snapshots = snapshotsRes.data || []
    const prevSnapshots = prevSnapshotsRes.data || []
    const barrels = barrelsRes.data || []

    // Barrel package summary (27 CFR 19.591)
    const barrelSummary = barrels.map((b) => ({
      package_id: b.barrel_number,
      spirits_type: b.spirits_type ?? 'bourbon',
      cooperage_code: b.cooperage_code ?? 'C',
      current_wine_gallons: b.current_wine_gallons ?? b.wine_gallons ?? 0,
      proof_gallons: b.entry_proof ? calcProofGallons(b.current_wine_gallons ?? b.wine_gallons ?? 0, b.entry_proof) : 0,
      location: b.warehouse_row ? `Row ${b.warehouse_row} Slot ${b.warehouse_slot} Tier ${b.warehouse_tier}` : '',
      status: b.status,
    }))

    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 15).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
          line_2_received_from_production: snap.received_proof_gallons,
          line_3_received_tib: 0,
          line_4_total_on_hand: snap.beg_proof_gallons + snap.received_proof_gallons,
          line_5_transferred_to_processing: snap.removed_proof_gallons,
          line_6_transferred_tib: 0,
          line_7_losses_angels_share: 0,
          line_8_other_removals: 0,
          line_9_total_removed: snap.removed_proof_gallons,
          line_10_ending_proof_gallons: snap.end_proof_gallons,
          reconciliation_check: Math.abs(snap.discrepancy_wine_gallons) < 0.01 ? 'BALANCED' : `VARIANCE: ${snap.discrepancy_wine_gallons.toFixed(2)} WG`,
          prior_month_ending: prev?.end_proof_gallons ?? null,
          continuity_check: prev ? (Math.abs(snap.beg_proof_gallons - prev.end_proof_gallons) < 0.01 ? 'OK' : 'MISMATCH — investigate before filing') : 'No prior period data',
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
    const [logsRes, prevSnapshotsRes] = await Promise.all([
      admin.from('production_logs').select('*').eq('distillery_id', distilleryId)
        .gte('occurred_at', periodStart.toISOString()).lte('occurred_at', periodEnd.toISOString()),
      admin.from('compliance_snapshots').select('*').eq('distillery_id', distilleryId).eq('period', prevPeriodStart.toISOString().split('T')[0]),
    ])

    const logs = logsRes.data || []
    const prevSnapshots = prevSnapshotsRes.data || []

    const mash = logs.filter((l) => l.log_type === 'mash_batch')
    const fermentation = logs.filter((l) => l.log_type === 'fermentation')
    const distillation = logs.filter((l) => l.log_type === 'distillation')
    const transfers = logs.filter((l) => l.log_type === 'transfer_to_storage')
    const losses = logs.filter((l) => l.log_type === 'production_loss')

    const producedPG = distillation.reduce((s, l) => s + (l.spirits_produced_proof_gallons ?? 0), 0)
    const transferredPG = transfers.reduce((s, l) => s + (l.transfer_proof_gallons ?? 0), 0)
    const lossPG = losses.reduce((s, l) => s + (l.loss_proof_gallons ?? 0), 0)

    // Group production by spirits type
    const byType: Record<string, number> = {}
    for (const d of distillation) {
      const t = d.spirits_type ?? 'bourbon'
      byType[t] = (byType[t] ?? 0) + (d.spirits_produced_proof_gallons ?? 0)
    }

    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 15).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return NextResponse.json({
      form: '5110.40',
      title: 'Monthly Report of Production Operations',
      period: periodLabel,
      due_date: dueDate,
      distillery_name: distillery?.name ?? '',
      dsp_number: distillery?.dsp_number ?? '',
      generated_at: new Date().toISOString(),
      line_1_mash_batches: mash.length,
      line_2_fermentations_started: fermentation.length,
      line_3_distillation_runs: distillation.length,
      line_4_produced_by_type: Object.entries(byType).map(([spirits_type, proof_gallons]) => ({
        spirits_type, label: spiritsLabel(spirits_type), proof_gallons,
      })),
      line_5_total_produced_proof_gallons: producedPG,
      line_6_transferred_to_storage_proof_gallons: transferredPG,
      line_7_production_losses_proof_gallons: lossPG,
      line_8_losses_detail: losses.map((l) => ({ cause: l.loss_cause, proof_gallons: l.loss_proof_gallons, notes: l.notes })),
      line_9_ending_production_account: producedPG - transferredPG - lossPG,
      raw_logs: {
        mash_batches: mash,
        fermentation_runs: fermentation,
        distillation_runs: distillation,
        transfers_to_storage: transfers,
        production_losses: losses,
      },
      zero_activity: logs.length === 0,
    })
  }

  if (form === '5110-28') {
    // Form 5110.28 — Monthly Report of Processing Operations
    const logsRes = await admin.from('processing_logs').select('*').eq('distillery_id', distilleryId)
      .gte('occurred_at', periodStart.toISOString()).lte('occurred_at', periodEnd.toISOString())
    const logs = logsRes.data || []

    const receipts = logs.filter((l) => l.log_type === 'processing_receipt')
    const bottling = logs.filter((l) => l.log_type === 'bottling_run')
    const remnants = logs.filter((l) => l.log_type === 'remnant')
    const leakers = logs.filter((l) => l.log_type === 'leaker')
    const taxRemovals = logs.filter((l) => l.log_type === 'tax_removal')
    const losses = logs.filter((l) => l.log_type === 'processing_loss')

    const receivedPG = receipts.reduce((s, l) => s + (l.proof_gallons ?? 0), 0)
    const bottledPG = bottling.reduce((s, l) => s + (l.proof_gallons ?? 0), 0)
    const removalsPG = taxRemovals.reduce((s, l) => s + (l.proof_gallons ?? 0), 0)
    const lossPG = losses.reduce((s, l) => s + (l.proof_gallons ?? 0), 0)
    const totalBottles = bottling.reduce((s, l) => s + (l.bottles_filled ?? 0), 0)
    const totalCases = bottling.reduce((s, l) => s + (l.case_count ?? 0), 0)

    const periodLabel = periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dueDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 15).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
      line_6_removal_detail: taxRemovals.map((l) => ({
        removal_type: l.removal_type, proof_gallons: l.proof_gallons,
        product_name: l.product_name, occurred_at: l.occurred_at,
      })),
      line_7_losses_breakage_leakers_proof_gallons: lossPG,
      line_8_remnant_records: remnants.length,
      line_9_leaker_records: leakers.length,
      line_10_ending_processing_account: receivedPG - bottledPG - removalsPG - lossPG,
      bottling_summary: bottling.map((l) => ({
        product_name: l.product_name, spirits_type: l.spirits_type,
        proof: l.proof, bottles: l.bottles_filled, bottle_size_ml: l.bottle_size_ml,
        cases: l.case_count, proof_gallons: l.proof_gallons, occurred_at: l.occurred_at,
      })),
      zero_activity: logs.length === 0,
    })
  }

  return NextResponse.json({ error: `Unknown form: ${form}. Use 5110-11, 5110-40, or 5110-28` }, { status: 400 })
}
