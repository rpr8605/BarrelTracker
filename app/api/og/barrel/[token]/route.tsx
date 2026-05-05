import { ImageResponse } from 'next/og'
import { createServiceClient } from '@/lib/supabase-server'
import { getBarrelAgeMonths } from '@/lib/tags'

export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const db = createServiceClient()
  const { data: barrel } = await db
    .from('barrels')
    .select('barrel_number, mash_bill, grain_type, entry_date, status, distilleries(name, brand_color, logo_url)')
    .eq('public_token', params.token)
    .single()

  const distillery = barrel?.distilleries as unknown as { name: string; brand_color: string | null; logo_url: string | null } | null
  const brandColor = distillery?.brand_color ?? '#BA7517'
  const ageMonths = barrel?.entry_date ? getBarrelAgeMonths(barrel.entry_date) : null
  const ageYears = ageMonths ? (ageMonths / 12).toFixed(1) : null
  const grain = barrel?.grain_type?.[0] ?? barrel?.mash_bill ?? 'Whiskey'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          backgroundColor: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: brandColor, fontSize: 18, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {distillery?.name ?? 'Still'}
          </div>
          <div style={{
            color: '#fff', fontSize: 14, fontWeight: 600,
            background: brandColor + '33', border: `1px solid ${brandColor}50`,
            borderRadius: 8, padding: '6px 14px',
          }}>
            Tap to follow
          </div>
        </div>

        <div>
          <div style={{ color: '#666', fontSize: 22, marginBottom: 8 }}>Barrel</div>
          <div style={{ color: '#fff', fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>
            #{barrel?.barrel_number ?? '???'}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <div style={{ background: '#ffffff15', borderRadius: 24, padding: '8px 20px', color: '#ccc', fontSize: 18 }}>
              {grain}
            </div>
            {ageYears && (
              <div style={{ background: brandColor + '25', borderRadius: 24, padding: '8px 20px', color: brandColor, fontSize: 18, fontWeight: 600 }}>
                {ageYears} years
              </div>
            )}
            <div style={{ background: '#ffffff15', borderRadius: 24, padding: '8px 20px', color: '#888', fontSize: 18, textTransform: 'capitalize' }}>
              {barrel?.status ?? 'Aging'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#444', fontSize: 16 }}>Follow this barrel's journey from grain to glass</div>
          <div style={{ color: '#333', fontSize: 14 }}>Still Platform</div>
        </div>

        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 4,
          background: `linear-gradient(90deg, ${brandColor}, ${brandColor}00)`,
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
