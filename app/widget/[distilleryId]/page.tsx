import { createServiceClient } from '@/lib/supabase-server'
import type { Barrel } from '@/types/database'

export const dynamic = 'force-dynamic'

function ageMonths(entryDate: string | null): number | null {
  if (!entryDate) return null
  return Math.floor((Date.now() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

function formatAge(months: number | null): string {
  if (months === null) return '—'
  if (months < 12) return `${months}mo`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y}yr ${m}mo` : `${y}yr`
}

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: { distilleryId: string }
  searchParams: { theme?: string }
}) {
  const theme = searchParams.theme === 'light' ? 'light' : 'dark'
  const isDark = theme === 'dark'

  const supabase = createServiceClient()

  const { data: distillery } = await supabase
    .from('distilleries')
    .select('id, name')
    .eq('id', params.distilleryId)
    .single()

  const { data: barrels } = distillery
    ? await supabase
        .from('barrels')
        .select('id, barrel_number, grain_type, mash_bill, entry_date, status, tags')
        .eq('distillery_id', distillery.id)
        .in('status', ['aging', 'ready'])
        .limit(6)
    : { data: null }

  const bg = isDark ? '#0f0b07' : '#ffffff'
  const cardBg = isDark ? '#1a1410' : '#f7f3ee'
  const cardBorder = isDark ? '#2a2018' : '#e8e0d5'
  const textPrimary = isDark ? '#f5f0e8' : '#1a1208'
  const textMuted = isDark ? '#9a8a70' : '#7a6a50'

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: ${bg}; }
        .still-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${bg}; color: ${textPrimary}; padding: 16px; }
        .sw-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid ${cardBorder}; }
        .sw-title { font-size: 14px; font-weight: 600; }
        .sw-powered { font-size: 10px; color: ${textMuted}; }
        .sw-powered a { color: #BA7517; text-decoration: none; }
        .sw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .sw-card { background: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 10px; padding: 12px; }
        .sw-barrel { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .sw-grain { font-size: 11px; color: ${textMuted}; margin-bottom: 6px; }
        .sw-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .sw-age { font-size: 11px; color: ${textMuted}; }
        .sw-badge { font-size: 10px; padding: 2px 6px; border-radius: 999px; font-weight: 500; }
        .sw-ready { background: rgba(74,222,128,0.12); color: ${isDark ? '#4ade80' : '#16a34a'}; }
        .sw-aging { background: rgba(234,179,8,0.12); color: ${isDark ? '#eab308' : '#ca8a04'}; }
        .sw-adopt { display: block; width: 100%; padding: 7px; background: #BA7517; color: #fff; border: none; border-radius: 7px; font-size: 12px; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; }
        .sw-adopt:hover { background: #a36614; }
        .sw-empty { text-align: center; color: ${textMuted}; font-size: 13px; padding: 32px 16px; }
      `}</style>

      <div className="still-widget">
        <div className="sw-header">
          <div className="sw-title">
            {distillery ? `Available at ${distillery.name}` : 'Barrel Collection'}
          </div>
          <div className="sw-powered">
            Powered by{' '}
            <a href="https://barrel-tracker.vercel.app" target="_blank" rel="noreferrer">Still</a>
          </div>
        </div>

        {!distillery || !barrels || barrels.length === 0 ? (
          <div className="sw-empty">No barrels currently available.</div>
        ) : (
          <div className="sw-grid">
            {(barrels as Barrel[]).map((barrel) => {
              const months = ageMonths(barrel.entry_date)
              const grain =
                (Array.isArray(barrel.grain_type) ? barrel.grain_type.join(', ') : barrel.grain_type) ||
                barrel.mash_bill ||
                'Craft Whiskey'
              return (
                <div key={barrel.id} className="sw-card">
                  <div className="sw-barrel">{barrel.barrel_number}</div>
                  <div className="sw-grain">{grain}</div>
                  <div className="sw-meta">
                    <span className="sw-age">{formatAge(months)}</span>
                    <span className={`sw-badge ${barrel.status === 'ready' ? 'sw-ready' : 'sw-aging'}`}>
                      {barrel.status === 'ready' ? 'Ready' : 'Aging'}
                    </span>
                  </div>
                  <a
                    href={`https://barrel-tracker.vercel.app/adopt/${barrel.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="sw-adopt"
                  >
                    Adopt
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
