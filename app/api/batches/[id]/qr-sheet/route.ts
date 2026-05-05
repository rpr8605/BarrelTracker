import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import QRCode from 'qrcode'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const batchId = params.id

  // Auth check
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Fetch batch
  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, batch_number, distillery_id, bottle_count')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) {
    return new NextResponse('Batch not found', { status: 404 })
  }

  // Fetch all bottles for this batch ordered by bottle_number
  const { data: bottles, error: bottlesErr } = await supabase
    .from('bottles')
    .select('id, bottle_number, qr_token, status')
    .eq('batch_id', batchId)
    .order('bottle_number', { ascending: true })

  if (bottlesErr) {
    return new NextResponse('Failed to fetch bottles', { status: 500 })
  }

  if (!bottles || bottles.length === 0) {
    return new NextResponse('No bottles found for this batch', { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://still.app'

  // Generate QR data URIs for each bottle
  const bottleItems = await Promise.all(
    bottles.map(async (bottle) => {
      const url = `${appUrl}/bottle/${bottle.qr_token}`
      const dataUri = await QRCode.toDataURL(url, {
        width: 160,
        margin: 1,
        color: { dark: '#1a1a1a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      return { ...bottle, dataUri, url }
    })
  )

  const batchLabel = batch.batch_number || `Batch ${batchId.slice(-6).toUpperCase()}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QR Sheet — ${batchLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #1a1a1a;
      padding: 24px;
    }
    header {
      margin-bottom: 24px;
      border-bottom: 2px solid #BA7517;
      padding-bottom: 12px;
    }
    header h1 {
      font-size: 20px;
      font-weight: 700;
      color: #BA7517;
    }
    header p {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }
    .bottle-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .bottle-card img {
      width: 120px;
      height: 120px;
      display: block;
      margin: 0 auto 8px;
    }
    .bottle-number {
      font-size: 13px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .bottle-batch {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .bottle-status {
      font-size: 9px;
      color: #BA7517;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    @media print {
      body { padding: 12px; }
      header { margin-bottom: 16px; }
      .grid { gap: 10px; }
      .bottle-card { border-color: #ccc; }
      @page { margin: 0.5in; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Still — ${batchLabel}</h1>
    <p>${bottleItems.length} bottle${bottleItems.length !== 1 ? 's' : ''} &bull; Printed ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </header>
  <div class="grid">
    ${bottleItems.map((b) => `
    <div class="bottle-card">
      <img src="${b.dataUri}" alt="QR code for bottle #${b.bottle_number}" />
      <div class="bottle-number">#${b.bottle_number}</div>
      <div class="bottle-batch">${batchLabel}</div>
      <div class="bottle-status">${b.status.replace('_', ' ')}</div>
    </div>`).join('\n')}
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
