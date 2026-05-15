'use client'

interface Props {
  descriptors: [string, number][]
  size?: number
}

export function FlavorRadarChart({ descriptors, size = 280 }: Props) {
  if (descriptors.length === 0) {
    return <div className="text-sm text-[var(--color-text-muted)] text-center py-8">No tasting data yet.</div>
  }
  const max = Math.max(...descriptors.map((d) => d[1]))
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 36

  const points = descriptors.map(([label, val], i) => {
    const angle = (i / descriptors.length) * 2 * Math.PI - Math.PI / 2
    const ratio = max === 0 ? 0 : val / max
    return {
      label,
      val,
      x: cx + Math.cos(angle) * r * ratio,
      y: cy + Math.sin(angle) * r * ratio,
      lx: cx + Math.cos(angle) * (r + 18),
      ly: cy + Math.sin(angle) * (r + 18),
    }
  })

  const poly = points.map((p) => `${p.x},${p.y}`).join(' ')

  const rings = [0.25, 0.5, 0.75, 1].map((ratio, i) => {
    const ringPts = descriptors.map((_, j) => {
      const angle = (j / descriptors.length) * 2 * Math.PI - Math.PI / 2
      return `${cx + Math.cos(angle) * r * ratio},${cy + Math.sin(angle) * r * ratio}`
    }).join(' ')
    return <polygon key={i} points={ringPts} fill="none" stroke="var(--color-border)" strokeWidth={0.5} opacity={0.5} />
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-md mx-auto">
      {rings}
      <polygon points={poly} fill="#BA7517" fillOpacity={0.25} stroke="#BA7517" strokeWidth={1.5} />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={3} fill="#BA7517" />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="currentColor">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
