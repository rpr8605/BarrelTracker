import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const host = req.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const url = `${protocol}://${host}/barrels/${params.id}`

  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1a1209', light: '#ffffff' },
  })

  // Strip the data:image/png;base64, prefix and return raw PNG
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="barrel-${params.id.slice(-6)}.png"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
