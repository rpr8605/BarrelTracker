import type { Barrel } from '@/types/database'
import { getBarrelAgeMonths } from '@/lib/tags'

interface Props { barrel: Barrel; brandColor: string }

const MILESTONES = [
  { label: 'Filled', months: 0, note: 'New make spirit meets new oak' },
  { label: '6 months', months: 6, note: 'First color from charred oak' },
  { label: '2 years', months: 24, note: 'Straight designation earned' },
  { label: '4 years', months: 48, note: 'Complexity deepens significantly' },
  { label: '7 years', months: 84, note: 'Peak window begins for most mashbills' },
  { label: 'Bottled', months: null, note: 'Captured at peak expression' },
]

export function AgeMilestoneTimeline({ barrel, brandColor }: Props) {
  const currentMonths = barrel.entry_date ? getBarrelAgeMonths(barrel.entry_date) : 0
  const fillDate = barrel.entry_date ? new Date(barrel.entry_date) : null
  const predictedDate = barrel.predicted_peak_date ? new Date(barrel.predicted_peak_date) : null

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Age Milestones</h2>
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />
        <div className="space-y-4">
          {MILESTONES.filter((m) => m.months !== null || barrel.status === 'bottled').map((milestone, i) => {
            const months = milestone.months ?? currentMonths
            const isPast = months <= currentMonths
            const isCurrent = milestone.months !== null &&
              currentMonths >= months &&
              (i === MILESTONES.length - 2 || (MILESTONES[i + 1].months !== null && currentMonths < (MILESTONES[i + 1].months ?? Infinity)))

            const date = fillDate && milestone.months !== null
              ? new Date(fillDate.getTime() + milestone.months * 30.44 * 24 * 3600 * 1000)
              : null

            return (
              <div key={i} className={`flex gap-4 ${!isPast ? 'opacity-40' : ''}`}>
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10" style={{
                  backgroundColor: isPast ? brandColor : 'transparent',
                  borderColor: isPast ? brandColor : '#ffffff33',
                }}>
                  {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{milestone.label}</span>
                    {date && <span className="text-xs text-gray-500">{date.getFullYear()}</span>}
                    {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: brandColor + '33', color: brandColor }}>now</span>}
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{milestone.note}</p>
                </div>
              </div>
            )
          })}
          {predictedDate && barrel.status !== 'bottled' && (
            <div className="flex gap-4 opacity-60">
              <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center z-10" style={{ borderColor: brandColor }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Predicted peak</span>
                  <span className="text-xs text-gray-500">{predictedDate.getFullYear()}</span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">AI-estimated optimal bottling window</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
