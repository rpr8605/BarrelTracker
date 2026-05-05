import { NextRequest, NextResponse } from 'next/server'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import React from 'react'

export const runtime = 'nodejs'

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch('https://og-playground.vercel.app/inter-latin-ext-400-normal.woff', {
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return null
    return r.arrayBuffer()
  } catch {
    return null
  }
}

async function loadFontBold(): Promise<ArrayBuffer | null> {
  try {
    const r = await fetch('https://og-playground.vercel.app/inter-latin-ext-700-normal.woff', {
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return null
    return r.arrayBuffer()
  } catch {
    return null
  }
}

const BG = '#0f0b07'
const AMBER = '#BA7517'
const TEXT = '#f5f0e8'
const MUTED = '#a89070'
const SURFACE = '#1a1209'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    aging: '#2563eb',
    ready: '#16a34a',
    bottled: '#7c3aed',
    sold: '#6b7280',
  }
  const color = colors[status] ?? '#6b7280'
  return (
    <div
      style={{
        background: color + '33',
        border: `1px solid ${color}`,
        color,
        borderRadius: 6,
        padding: '4px 12px',
        fontSize: 14,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {status}
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            fontSize: 36,
            color: i <= rating ? AMBER : '#3a2e1e',
            lineHeight: 1,
          }}
        >
          ★
        </div>
      ))}
    </div>
  )
}

function BarrelCard(p: {
  barrelNumber: string
  distilleryName: string
  ageMonths: string
  status: string
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* amber top accent */}
      <div style={{ width: '100%', height: 6, background: AMBER }} />

      {/* content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 80px',
          gap: 0,
        }}
      >
        {/* Still wordmark */}
        <div
          style={{
            fontSize: 16,
            color: AMBER,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          STILL
        </div>

        {/* Barrel number */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: TEXT,
            letterSpacing: -2,
            textAlign: 'center',
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {p.barrelNumber}
        </div>

        {/* Distillery */}
        <div
          style={{
            fontSize: 28,
            color: MUTED,
            fontWeight: 400,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          {p.distilleryName}
        </div>

        {/* Age + status row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 8,
          }}
        >
          {p.ageMonths && (
            <div
              style={{
                fontSize: 18,
                color: MUTED,
                background: SURFACE,
                borderRadius: 8,
                padding: '6px 18px',
              }}
            >
              {p.ageMonths} months aged
            </div>
          )}
          <StatusBadge status={p.status} />
        </div>
      </div>

      {/* amber bottom strip */}
      <div
        style={{
          width: '100%',
          height: 12,
          background: AMBER,
        }}
      />
    </div>
  )
}

function TastingCard(p: {
  barrelNumber: string
  distilleryName: string
  rating: number
  tags: string[]
  date: string
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
      }}
    >
      <div style={{ width: '100%', height: 6, background: AMBER }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 100px',
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: AMBER,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          STILL · TASTING NOTE
        </div>

        <StarRow rating={p.rating} />

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: TEXT,
            textAlign: 'center',
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          {p.barrelNumber}
        </div>

        <div style={{ fontSize: 24, color: MUTED }}>{p.distilleryName}</div>

        {p.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              justifyContent: 'center',
              maxWidth: 800,
              marginTop: 4,
            }}
          >
            {p.tags.slice(0, 8).map((t) => (
              <div
                key={t}
                style={{
                  background: AMBER + '22',
                  border: `1px solid ${AMBER}66`,
                  color: AMBER,
                  borderRadius: 20,
                  padding: '6px 18px',
                  fontSize: 16,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 16, color: MUTED, marginTop: 8 }}>
          Tasted on {p.date}
        </div>
      </div>

      <div style={{ width: '100%', height: 12, background: AMBER }} />
    </div>
  )
}

function CheckinCard(p: {
  stopName: string
  badgeName: string
  trailName: string
  checkinNumber: string
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        border: `3px solid ${AMBER}`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', height: 6, background: AMBER }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 100px',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: AMBER,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          STILL · TRAIL BADGE
        </div>

        {/* Badge hexagon-ish circle */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            background: AMBER + '22',
            border: `3px solid ${AMBER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
          }}
        >
          🥃
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: TEXT,
            textAlign: 'center',
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          {p.badgeName}
        </div>

        <div style={{ fontSize: 24, color: AMBER, fontWeight: 600 }}>
          {p.stopName}
        </div>

        <div style={{ fontSize: 18, color: MUTED }}>{p.trailName}</div>

        {p.checkinNumber && (
          <div
            style={{
              fontSize: 14,
              color: MUTED,
              background: SURFACE,
              borderRadius: 6,
              padding: '4px 14px',
              marginTop: 8,
            }}
          >
            Check-in #{p.checkinNumber}
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: 12, background: AMBER }} />
    </div>
  )
}

function BatchCard(p: {
  batchNumber: string
  distilleryName: string
  bottleCount: string
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ width: '100%', height: 6, background: AMBER }} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 100px',
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: AMBER,
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          STILL · STORY MODE
        </div>

        <div
          style={{
            fontSize: 22,
            color: MUTED,
            fontWeight: 400,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          BATCH
        </div>

        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: TEXT,
            textAlign: 'center',
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          {p.batchNumber}
        </div>

        <div style={{ fontSize: 28, color: MUTED, marginTop: 8 }}>
          {p.distilleryName}
        </div>

        {p.bottleCount && (
          <div
            style={{
              fontSize: 20,
              color: AMBER,
              fontWeight: 600,
              marginTop: 12,
              background: AMBER + '18',
              borderRadius: 8,
              padding: '8px 28px',
              border: `1px solid ${AMBER}44`,
            }}
          >
            {p.bottleCount} bottles
          </div>
        )}
      </div>

      <div style={{ width: '100%', height: 12, background: AMBER }} />
    </div>
  )
}

async function renderCard(element: React.ReactElement): Promise<Buffer> {
  const [fontData, fontBold] = await Promise.all([loadFont(), loadFontBold()])

  const fonts: Parameters<typeof satori>[1]['fonts'] = []
  if (fontData) {
    fonts.push({ name: 'Inter', data: fontData, weight: 400, style: 'normal' })
  }
  if (fontBold) {
    fonts.push({ name: 'Inter', data: fontBold, weight: 700, style: 'normal' })
  }

  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
  return Buffer.from(resvg.render().asPng())
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') ?? 'barrel'

  let element: React.ReactElement

  if (type === 'barrel') {
    element = (
      <BarrelCard
        barrelNumber={searchParams.get('barrelNumber') ?? searchParams.get('barrelId') ?? 'Barrel #001'}
        distilleryName={searchParams.get('distilleryName') ?? 'Still Distillery'}
        ageMonths={searchParams.get('ageMonths') ?? ''}
        status={searchParams.get('status') ?? 'aging'}
      />
    )
  } else if (type === 'tasting') {
    const tagsParam = searchParams.get('tags') ?? ''
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : []
    const rating = parseInt(searchParams.get('rating') ?? '4', 10)
    const dateStr = searchParams.get('date') ?? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    element = (
      <TastingCard
        barrelNumber={searchParams.get('barrelNumber') ?? searchParams.get('barrelId') ?? 'Barrel #001'}
        distilleryName={searchParams.get('distilleryName') ?? 'Still Distillery'}
        rating={rating}
        tags={tags}
        date={dateStr}
      />
    )
  } else if (type === 'checkin') {
    element = (
      <CheckinCard
        stopName={searchParams.get('stopName') ?? 'Distillery Stop'}
        badgeName={searchParams.get('badgeName') ?? 'Pioneer'}
        trailName={searchParams.get('trailName') ?? 'Veterans Whiskey Trail'}
        checkinNumber={searchParams.get('checkinNumber') ?? '1'}
      />
    )
  } else if (type === 'batch') {
    element = (
      <BatchCard
        batchNumber={searchParams.get('batchNumber') ?? 'VWT-001'}
        distilleryName={searchParams.get('distilleryName') ?? 'Still Distillery'}
        bottleCount={searchParams.get('bottleCount') ?? ''}
      />
    )
  } else {
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  }

  try {
    const png = await renderCard(element)
    return new Response(png as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (err) {
    console.error('[OG] render error', err)
    return NextResponse.json({ error: 'Render failed' }, { status: 500 })
  }
}
