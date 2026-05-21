import { SupabaseClient } from '@supabase/supabase-js';
import { GaugeRecord, ProductionLog, TtbReport, InventoryAttestation, ProcessingLog } from '../../types/database';

export interface ComplianceAuditResult {
  risk_score: number; // 0-100, where 100 is highest risk
  risk_categories: {
    category: string;
    risk_level: 'low' | 'medium' | 'high';
    findings: string[];
  }[];
  missing_data_checklist: {
    item: string;
    status: 'missing' | 'complete' | 'partial';
    details?: string;
  }[];
}

/**
 * Runs a compliance audit for a distillery by analyzing records for discrepancies,
 * late entries, and missing documentation.
 */
export async function runComplianceAudit(
  supabase: SupabaseClient,
  distilleryId: string
): Promise<ComplianceAuditResult> {
  // Fetch data
  const [
    { data: gauges },
    { data: productionLogs },
    { data: processingLogs },
    { data: ttbReports },
    { data: attestations }
  ] = await Promise.all([
    supabase.from('gauge_records').select('*').eq('distillery_id', distilleryId).order('gauged_at', { ascending: false }).limit(200),
    supabase.from('production_logs').select('*').eq('distillery_id', distilleryId).order('occurred_at', { ascending: false }).limit(200),
    supabase.from('processing_logs').select('*').eq('distillery_id', distilleryId).order('occurred_at', { ascending: false }).limit(200),
    supabase.from('ttb_report_periods').select('*').eq('distillery_id', distilleryId).order('report_month', { ascending: false }).limit(12),
    supabase.from('inventory_attestations').select('*').eq('distillery_id', distilleryId).order('inventory_date', { ascending: false }).limit(10),
  ]);

  const findings: string[] = [];
  const checklist: ComplianceAuditResult['missing_data_checklist'] = [];
  let riskScore = 0;

  // 1. Check for Unsigned Attestations
  const draftAttestations = (attestations as InventoryAttestation[] | null)?.filter(a => a.status === 'draft') || [];
  if (draftAttestations.length > 0) {
    riskScore += draftAttestations.length * 10;
    findings.push(`${draftAttestations.length} inventory attestations are still in draft status.`);
  }
  checklist.push({
    item: 'Inventory Attestations',
    status: draftAttestations.length === 0 ? 'complete' : 'partial',
    details: draftAttestations.length > 0 ? 'Unsigned drafts found' : 'All recent attestations signed'
  });

  // 2. Check for Late Entries (Entries created > 24h after occurrence)
  const allLogs = [
    ...(productionLogs || []).map(l => ({ occurred: l.occurred_at, created: l.created_at })),
    ...(processingLogs || []).map(l => ({ occurred: l.occurred_at, created: l.created_at })),
    ...(gauges || []).map(l => ({ occurred: l.gauged_at, created: l.created_at }))
  ];

  const lateEntries = allLogs.filter(log => {
    const occ = new Date(log.occurred).getTime();
    const cre = new Date(log.created).getTime();
    return (cre - occ) > (24 * 60 * 60 * 1000); // 24 hours
  });

  if (lateEntries.length > 0) {
    riskScore += Math.min(30, lateEntries.length * 2);
    findings.push(`${lateEntries.length} records were entered more than 24 hours after occurrence.`);
  }

  // 3. Check for Production/Gauge mismatches
  // Simple check: do we have production logs for distillation without corresponding production gauges?
  const distillRuns = (productionLogs as ProductionLog[] | null)?.filter(l => l.log_type === 'distillation') || [];
  const prodGauges = (gauges as GaugeRecord[] | null)?.filter(g => g.gauge_type === 'production') || [];
  
  if (distillRuns.length > prodGauges.length) {
    riskScore += 20;
    findings.push('Fewer production gauges found than distillation runs. Possible missing TTB records.');
  }

  // 4. Check for filed TTB reports
  const pendingReports = (ttbReports as TtbReport[] | null)?.filter(r => r.status === 'draft') || [];
  if (pendingReports.length > 0) {
    riskScore += 15;
    findings.push(`${pendingReports.length} TTB reports are in draft and not yet filed.`);
  }

  // Final Score Cap
  riskScore = Math.min(100, riskScore);

  const categories: ComplianceAuditResult['risk_categories'] = [
    {
      category: 'Documentation Timeliness',
      risk_level: lateEntries.length > 10 ? 'high' : lateEntries.length > 2 ? 'medium' : 'low',
      findings: lateEntries.length > 0 ? [`${lateEntries.length} late entries detected.`] : ['All records entered promptly.']
    },
    {
      category: 'Reporting & Attestations',
      risk_level: (draftAttestations.length + pendingReports.length) > 2 ? 'high' : (draftAttestations.length + pendingReports.length) > 0 ? 'medium' : 'low',
      findings: [...draftAttestations.map(a => `Draft attestation for ${a.period_label}`), ...pendingReports.map(r => `Unfiled report for ${r.report_month}`)]
    }
  ];

  return {
    risk_score: riskScore,
    risk_categories: categories,
    missing_data_checklist: checklist
  };
}
