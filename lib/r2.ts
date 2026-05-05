import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const R2_CONFIGURED =
  !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
  !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
  !!process.env.CLOUDFLARE_R2_ACCOUNT_ID

const IS_DEV = process.env.NODE_ENV === 'development'
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), '.local-uploads')

export const r2Client = R2_CONFIGURED
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
      },
    })
  : null

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'still-voice-notes'

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  if (!R2_CONFIGURED) {
    if (!IS_DEV) {
      throw new Error('R2 credentials not configured. Set CLOUDFLARE_R2_ACCESS_KEY_ID and CLOUDFLARE_R2_SECRET_ACCESS_KEY.')
    }
    // Local dev fallback — save to .local-uploads/
    const localPath = path.join(LOCAL_UPLOAD_DIR, key)
    await mkdir(path.dirname(localPath), { recursive: true })
    await writeFile(localPath, body)
    const localUrl = `/api/local-uploads/${key}`
    console.warn(`[R2 dev fallback] Saved to ${localPath}. Serving at ${localUrl}`)
    return localUrl
  }

  await r2Client!.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `https://pub-${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev/${BUCKET}/${key}`
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (!R2_CONFIGURED) {
    return `/api/local-uploads/${key}`
  }
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2Client!, command, { expiresIn })
}

export function generateVoiceNoteKey(barrelId: string, noteId: string): string {
  return `voice-notes/${barrelId}/${noteId}.webm`
}

export function generatePhotoKey(barrelId: string, filename: string): string {
  return `barrel-photos/${barrelId}/${Date.now()}-${filename}`
}

export function isR2Configured(): boolean {
  return R2_CONFIGURED
}
