import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'still-voice-notes'

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(r2Client, command, { expiresIn })
}

export function generateVoiceNoteKey(barrelId: string, noteId: string): string {
  return `voice-notes/${barrelId}/${noteId}.webm`
}

export function generatePhotoKey(barrelId: string, filename: string): string {
  return `barrel-photos/${barrelId}/${Date.now()}-${filename}`
}
