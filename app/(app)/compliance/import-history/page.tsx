'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { formatDate } from '@/lib/utils'

interface ExtractedRecord {
  form_type: '5110.40' | '5110.11' | '5110.28'
  report_month: string
  distillery_name: string | null
  dsp_number: string | null
  line_items: Record<string, unknown>
  confirmation_number: string | null
  filed_date: string | null
  filename: string
}

interface ManualRecord {
  report_month: string
  form_type: '5110.40' | '5110.11' | '5110.28'
  confirmation_number: string
  notes: string
}

export default function ImportHistoryPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [existingCount, setExistingCount] = useState<number>(0)
  const [tab, setTab] = useState<'pdf' | 'manual'>('pdf')

  const [file, setFile] = useState<File | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedRecord[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success_count: number; error_count: number } | null>(null)

  const [manualRecords, setManualRecords] = useState<ManualRecord[]>([
    { report_month: '', form_type: '5110.40', confirmation_number: '', notes: '' }
  ])
  const [manualSaving, setManualSaving] = useState(false)

  const load = useCallback(async (id: string) => {
    const data = await fetch(`/api/compliance/import-history?distillery_id=${id}`).then((r) => r.json())
    setExistingCount(data.count ?? 0)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => {
        if (!id) return
        setDistilleryId(id)
        load(id)
      })
    })
  }, [load])

  async function extractFromPDF() {
    if (!file) return
    setExtracting(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/compliance/import-history/extract', { method: 'POST', body: fd }).then((r) => r.json())
    if (res.extracted) {
      setExtracted((p) => [...p, { ...res.extracted, filename: file.name }])
      setFile(null)
    }
    setExtracting(false)
  }

  async function importExtracted() {
    if (!distilleryId || extracted.length === 0) return
    setImporting(true)
    const res = await fetch('/api/compliance/import-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        records: extracted.map((r) => ({
          report_month: r.report_month,
          form_type: r.form_type,
          line_items: r.line_items,
          confirmation_number: r.confirmation_number,
          filed_date: r.filed_date,
        })),
      }),
    }).then((r) => r.json())
    setImportResult({ success_count: res.success_count, error_count: res.error_count })
    if (res.success_count > 0) {
      setExtracted([])
      load(distilleryId)
    }
    setImporting(false)
  }

  async function saveManual() {
    if (!distilleryId) return
    const valid = manualRecords.filter((r) => r.report_month && r.form_type)
    if (valid.length === 0) return
    setManualSaving(true)
    const res = await fetch('/api/compliance/import-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        records: valid.map((r) => ({
          report_month: `${r.report_month}-01`,
          form_type: r.form_type,
          line_items: {},
          confirmation_number: r.confirmation_number || null,
        })),
      }),
    }).then((r) => r.json())
    setImportResult({ success_count: res.success_count, error_count: res.error_count })
    if (res.success_count > 0) {
      setManualRecords([{ report_month: '', form_type: '5110.40', confirmation_number: '', notes: '' }])
      load(distilleryId)
    }
    setManualSaving(false)
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div>
        <h1 className="font-medium text-lg">Import Historical Reports</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Import prior-year TTB filings so continuity checks work from day one.
          {existingCount > 0 && ` ${existingCount} period${existingCount !== 1 ? 's' : ''} already on file.`}
        </p>
      </div>

      {importResult && (
        <div className={`rounded-lg border p-3 text-sm ${importResult.error_count > 0 ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' : 'border-green-500/30 bg-green-500/5 text-green-400'}`}>
          {importResult.success_count > 0 && `${importResult.success_count} record${importResult.success_count !== 1 ? 's' : ''} imported successfully.`}
          {importResult.error_count > 0 && ` ${importResult.error_count} failed.`}
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)]">
        <button onClick={() => setTab('pdf')} className={`flex-1 py-1.5 text-sm rounded-md transition-all ${tab === 'pdf' ? 'bg-[var(--color-bg)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>PDF Extract (AI)</button>
        <button onClick={() => setTab('manual')} className={`flex-1 py-1.5 text-sm rounded-md transition-all ${tab === 'manual' ? 'bg-[var(--color-bg)] shadow-sm text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>Manual Entry</button>
      </div>

      {tab === 'pdf' && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <p className="text-sm font-medium">Upload TTB form PDF</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload a completed Form 5110.40, 5110.11, or 5110.28 PDF. Claude AI will extract the line-item data automatically.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm text-[var(--color-text-muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              />
              <Button size="sm" onClick={extractFromPDF} loading={extracting} disabled={!file}>Extract</Button>
            </div>
          </Card>

          {extracted.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{extracted.length} record{extracted.length !== 1 ? 's' : ''} ready to import</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setExtracted([])}>Clear all</Button>
                  <Button size="sm" onClick={importExtracted} loading={importing}>Import all</Button>
                </div>
              </div>
              {extracted.map((r, i) => (
                <Card key={i} className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Form {r.form_type} — {r.report_month?.slice(0, 7)}</span>
                    <Button size="sm" variant="secondary" onClick={() => setExtracted((p) => p.filter((_, j) => j !== i))}>Remove</Button>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {r.filename}{r.confirmation_number ? ` · Confirmation: ${r.confirmation_number}` : ''}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {Object.keys(r.line_items).length} line items extracted
                    {r.distillery_name ? ` · ${r.distillery_name}` : ''}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {extracted.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
              <p>Upload a PDF to get started.</p>
              <p className="mt-1 text-xs">Supports Forms 5110.40, 5110.11, 5110.28. One PDF at a time.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'manual' && (
        <div className="space-y-4">
          <Card className="space-y-3">
            <div>
              <p className="text-sm font-medium">Enter filing records manually</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Add one row per filed form/period. Confirmation numbers help with continuity checks.</p>
            </div>
            {manualRecords.map((r, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-end">
                <Input
                  label={i === 0 ? 'Period (YYYY-MM)' : undefined}
                  placeholder="2025-01"
                  value={r.report_month}
                  onChange={(e) => setManualRecords((p) => p.map((rec, j) => j === i ? { ...rec, report_month: e.target.value } : rec))}
                />
                <Select
                  label={i === 0 ? 'Form' : undefined}
                  value={r.form_type}
                  onChange={(e) => setManualRecords((p) => p.map((rec, j) => j === i ? { ...rec, form_type: e.target.value as ManualRecord['form_type'] } : rec))}
                >
                  <option value="5110.40">5110.40 Production</option>
                  <option value="5110.11">5110.11 Storage</option>
                  <option value="5110.28">5110.28 Processing</option>
                </Select>
                <Input
                  label={i === 0 ? 'Confirmation #' : undefined}
                  placeholder="Optional"
                  value={r.confirmation_number}
                  onChange={(e) => setManualRecords((p) => p.map((rec, j) => j === i ? { ...rec, confirmation_number: e.target.value } : rec))}
                />
                <Button size="sm" variant="secondary" onClick={() => setManualRecords((p) => p.filter((_, j) => j !== i))}>✕</Button>
              </div>
            ))}
            <div className="flex gap-3">
              <Button size="sm" variant="secondary" onClick={() => setManualRecords((p) => [...p, { report_month: '', form_type: '5110.40', confirmation_number: '', notes: '' }])}>+ Add row</Button>
              <Button size="sm" onClick={saveManual} loading={manualSaving} disabled={!manualRecords.some((r) => r.report_month)}>Save all</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
