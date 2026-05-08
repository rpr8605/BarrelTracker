import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface InventoryItem {
  container_id: string
  container_type: string
  spirit_class: string
  proof_gallons: number
  wine_gallons: number
  location?: string
  notes?: string
}

export interface AttestationPDFData {
  distillery_name: string
  dsp_number: string
  inventory_type: 'storage_quarterly' | 'processing_semiannual'
  period_label: string
  period_end_date: string
  items: InventoryItem[]
  total_containers: number
  total_proof_gallons: number
  total_wine_gallons: number
  signed_by_name: string
  signed_by_title: string
  signed_at: string
  perjury_statement: string
  discrepancy_noted: boolean
  discrepancy_notes?: string
}

export async function generateAttestationPDF(data: AttestationPDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)

  const addPage = () => {
    const p = doc.addPage([612, 792])
    return { p, y: 750 }
  }

  let { p, y } = addPage()
  const L = 50, R = 562, W = R - L

  const line = (text: string, x: number, yPos: number, size = 10, bold = false, color = rgb(0, 0, 0)) => {
    p.drawText(text, { x, y: yPos, size, font: bold ? boldFont : font, color })
  }

  const hrule = (yPos: number) => {
    p.drawLine({ start: { x: L, y: yPos }, end: { x: R, y: yPos }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
  }

  // Header
  line('DISTILLED SPIRITS PLANT INVENTORY ATTESTATION', L, y, 12, true)
  y -= 16
  line('27 CFR Part 19 — Retained per 27 CFR 19.631', L, y, 9, false, rgb(0.4, 0.4, 0.4))
  y -= 20
  hrule(y); y -= 14

  line(`Distillery: ${data.distillery_name}`, L, y, 10, true)
  line(`DSP: ${data.dsp_number || 'Not set'}`, 400, y, 10)
  y -= 14
  const typeLabel = data.inventory_type === 'storage_quarterly' ? 'Quarterly Storage Inventory' : 'Semi-Annual Processing Inventory'
  line(`Report Type: ${typeLabel}`, L, y, 10)
  line(`Period End: ${data.period_end_date}`, 400, y, 10)
  y -= 20
  hrule(y); y -= 16

  // Table header
  const cols = { id: L, type: 120, class: 220, wg: 340, pg: 430, loc: 490 }
  line('Container ID', cols.id, y, 9, true)
  line('Type', cols.type, y, 9, true)
  line('Spirit Class', cols.class, y, 9, true)
  line('Wine Gal', cols.wg, y, 9, true)
  line('Proof Gal', cols.pg, y, 9, true)
  line('Location', cols.loc, y, 9, true)
  y -= 4; hrule(y); y -= 12

  for (const item of data.items) {
    if (y < 100) {
      const next = addPage(); p = next.p; y = next.y
    }
    line(item.container_id, cols.id, y, 8)
    line(item.container_type, cols.type, y, 8)
    line(item.spirit_class, cols.class, y, 8)
    line(item.wine_gallons.toFixed(4), cols.wg, y, 8)
    line(item.proof_gallons.toFixed(4), cols.pg, y, 8)
    if (item.location) line(item.location.slice(0, 18), cols.loc, y, 8)
    y -= 12
  }

  hrule(y); y -= 14
  line(`Totals — ${data.total_containers} containers`, L, y, 9, true)
  line(data.total_wine_gallons.toFixed(4), cols.wg, y, 9, true)
  line(data.total_proof_gallons.toFixed(4), cols.pg, y, 9, true)
  y -= 20

  if (data.discrepancy_noted && data.discrepancy_notes) {
    hrule(y); y -= 14
    line('DISCREPANCY NOTED:', L, y, 9, true, rgb(0.8, 0.3, 0))
    y -= 12
    line(data.discrepancy_notes.slice(0, 120), L, y, 9)
    y -= 16
  }

  // Attestation block
  hrule(y); y -= 16
  line('ATTESTATION', L, y, 11, true)
  y -= 14

  // Word-wrap the perjury statement
  const words = data.perjury_statement.split(' ')
  let lineText = ''
  for (const word of words) {
    const test = lineText ? `${lineText} ${word}` : word
    if (font.widthOfTextAtSize(test, 9) > W) {
      line(lineText, L, y, 9)
      y -= 12; lineText = word
    } else { lineText = test }
  }
  if (lineText) { line(lineText, L, y, 9); y -= 16 }

  line(`Signed by: ${data.signed_by_name}`, L, y, 10, true)
  y -= 14
  line(`Title: ${data.signed_by_title}`, L, y, 10)
  y -= 14
  line(`Date/Time: ${new Date(data.signed_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT`, L, y, 10)
  y -= 14
  line('Digitally signed via Still platform — barrel-tracker.vercel.app', L, y, 8, false, rgb(0.5, 0.5, 0.5))
  y -= 20

  hrule(y); y -= 12
  line('Retain this record for a minimum of 3 years per 27 CFR 19.631.', L, y, 8, false, rgb(0.5, 0.5, 0.5))

  return doc.save()
}
