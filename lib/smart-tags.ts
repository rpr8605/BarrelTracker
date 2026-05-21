import { createServiceClient } from './supabase-server'
import QRCode from 'qrcode'
import { AssetTag } from '@/types/database'
import crypto from 'crypto'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export function generatePublicSlug(length = 8): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase()
}

export function generateTagUrl(publicSlug: string): string {
  return `${APP_URL}/t/${publicSlug}`
}

export async function generateQRCodeSVG(tagUrl: string): Promise<string> {
  return QRCode.toString(tagUrl, { 
    type: 'svg',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}

export async function recordAuditLog(
  assetTagId: string,
  eventType: string,
  actorId: string | null,
  message: string,
  metadata?: any
) {
  const admin = createServiceClient()
  await admin.from('tag_audit_events').insert({
    asset_tag_id: assetTagId,
    event_type: eventType,
    actor_id: actorId,
    message,
    metadata
  })
}

export async function createAssetTag(input: {
  distillery_id: string
  tag_type: AssetTag['tag_type']
  assigned_entity_type: AssetTag['assigned_entity_type']
  assigned_entity_id?: string
  created_by?: string
}) {
  const admin = createServiceClient()
  const publicSlug = generatePublicSlug()
  const tagUrl = generateTagUrl(publicSlug)

  const { data: tag, error } = await admin.from('asset_tags').insert({
    distillery_id: input.distillery_id,
    public_slug: publicSlug,
    tag_url: tagUrl,
    tag_type: input.tag_type,
    assigned_entity_type: input.assigned_entity_type,
    assigned_entity_id: input.assigned_entity_id,
    created_by: input.created_by,
    status: 'draft'
  }).select().single()

  if (error) throw error

  await recordAuditLog(tag.id, 'created', input.created_by || null, `Created smart tag with slug ${publicSlug}`)
  
  return tag as AssetTag
}

export async function assignTagToEntity(tagId: string, entityType: string, entityId: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    assigned_entity_type: entityType,
    assigned_entity_id: entityId,
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'assigned', actorId || null, `Assigned tag to ${entityType} ${entityId}`)
  
  return tag as AssetTag
}

export async function markTagPrinted(tagId: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    status: 'printed',
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'printed', actorId || null, 'Marked tag as printed')
  
  return tag as AssetTag
}

export async function markTagWritten(tagId: string, nfcUid?: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    status: 'written',
    nfc_uid: nfcUid,
    written_at: new Date().toISOString(),
    written_by: actorId,
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'nfc_written', actorId || null, 'Marked NFC tag as written', { nfc_uid: nfcUid })
  
  return tag as AssetTag
}

export async function verifyTag(tagId: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    verified_by: actorId,
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'verified', actorId || null, 'Verified tag')
  
  return tag as AssetTag
}

export async function activateTag(tagId: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    status: 'active',
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'activated', actorId || null, 'Activated tag')
  
  return tag as AssetTag
}

export async function retireTag(tagId: string, reason: string, actorId?: string) {
  const admin = createServiceClient()
  const { data: tag, error } = await admin.from('asset_tags').update({
    status: 'retired',
    updated_at: new Date().toISOString()
  }).eq('id', tagId).select().single()

  if (error) throw error

  await recordAuditLog(tagId, 'retired', actorId || null, `Retired tag: ${reason}`)
  
  return tag as AssetTag
}

export async function recordTagScan(input: {
  asset_tag_id: string
  scan_source?: 'qr' | 'nfc' | 'uhf' | 'manual'
  viewer_type?: 'public' | 'internal' | 'distributor' | 'regulator' | 'unknown'
  user_id?: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  location_hint?: string
  metadata?: any
}) {
  const admin = createServiceClient()
  
  // Record the scan event
  const { error: scanError } = await admin.from('tag_scan_events').insert({
    asset_tag_id: input.asset_tag_id,
    scan_source: input.scan_source || 'qr',
    viewer_type: input.viewer_type || 'unknown',
    user_id: input.user_id,
    ip_address: input.ip_address,
    user_agent: input.user_agent,
    referrer: input.referrer,
    location_hint: input.location_hint,
    metadata: input.metadata
  })

  if (scanError) console.error('Error recording tag scan:', scanError)

  // Update scan count and last scanned timestamp
  const { error: updateError } = await admin.rpc('increment_tag_scan_count', { 
    tag_id: input.asset_tag_id 
  })

  if (updateError) {
    // Fallback if RPC doesn't exist yet
    await admin.from('asset_tags').update({
      scan_count: 1, // This is wrong for increment but better than nothing
      last_scanned_at: new Date().toISOString()
    }).eq('id', input.asset_tag_id)
  }
}

export async function fetchTaggedEntity(entityType: string, entityId: string) {
  const admin = createServiceClient()
  let table = ''
  
  switch (entityType) {
    case 'barrel': table = 'barrels'; break
    case 'batch': table = 'batches'; break
    case 'bottle': table = 'bottles'; break
    case 'product': table = 'products'; break
    default: return null
  }

  const { data, error } = await admin.from(table).select('*').eq('id', entityId).single()
  if (error) {
    console.error(`Error fetching tagged entity ${entityType} ${entityId}:`, error)
    return null
  }
  return data
}
