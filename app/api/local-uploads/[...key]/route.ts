import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Dev-only route — serves files saved to .local-uploads/ when R2 credentials are absent
export async function GET(req: NextRequest, { params }: { params: { key: string[] } }) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const key = params.key.join('/')
  const filePath = path.join(process.cwd(), '.local-uploads', key)

  try {
    const data = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === '.webm' ? 'audio/webm' :
      ext === '.mp4' ? 'video/mp4' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.png' ? 'image/png' :
      ext === '.gif' ? 'image/gif' :
      'application/octet-stream'

    return new NextResponse(data, { headers: { 'Content-Type': contentType } })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
