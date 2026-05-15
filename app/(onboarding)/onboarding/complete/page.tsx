import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function OnboardingCompletePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createServiceClient()
  const preferred = cookies().get('active_distillery')?.value
  const distilleryId = await getMyDistilleryId(admin, user.id, preferred)
  if (!distilleryId) redirect('/login')

  const [{ data: dsp }, { data: bond }, { data: prod }, { data: storage }, { data: proc }] = await Promise.all([
    admin.from('dsp_registration').select('dsp_number, dsp_skipped, operations_type').eq('distillery_id', distilleryId).maybeSingle(),
    admin.from('dsp_bond').select('bond_type').eq('distillery_id', distilleryId).eq('is_active', true).maybeSingle(),
    admin.from('production_station').select('stills, fermenters').eq('distillery_id', distilleryId).maybeSingle(),
    admin.from('storage_station').select('warehouses').eq('distillery_id', distilleryId).maybeSingle(),
    admin.from('processing_station').select('operations').eq('distillery_id', distilleryId).maybeSingle(),
  ])

  const checks = [
    { ok: true, label: 'Distillery profile' },
    { ok: !!dsp?.dsp_number, label: 'DSP registration', skipped: !!dsp?.dsp_skipped },
    { ok: !!bond, label: 'Bond information' },
    { ok: !!prod && !!storage && !!proc, label: 'Compliance stations' },
    { ok: true, label: 'Barrel defaults' },
  ]
  const incomplete = checks.filter((c) => !c.ok && !c.skipped).length
  const skippedCount = checks.filter((c) => c.skipped).length

  return (
    <div className="min-h-screen bg-[#1E2832] text-[#E8D5B0] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#BA7517] grid place-items-center mb-6 animate-[pulse_2s_ease-in-out_infinite]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-white tracking-wide"
          style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '0.05em' }}
        >
          YOU&apos;RE READY TO RUN.
        </h1>
        <p className="mt-4 text-sm md:text-base text-[#E8D5B0]/70 leading-relaxed">
          Your distillery profile, DSP registration, bond information, and three compliance stations are configured.
          Still is ready to track every barrel, every voice note, and every ounce from grain to glass.
        </p>

        <div className="mt-8 p-4 rounded-2xl border border-white/10 bg-[#252F3A] text-left">
          <div className="text-xs uppercase tracking-widest text-[#BA7517] font-mono mb-3">SETUP CHECKLIST</div>
          <ul className="space-y-2 text-sm">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className={c.ok ? 'text-[#4A9E6B]' : c.skipped ? 'text-[#D4922A]' : 'text-[#C0392B]'}>
                  {c.ok ? '✓' : c.skipped ? '⏭' : '○'}
                </span>
                <span className="text-[#E8D5B0]">{c.label}</span>
                {c.skipped && <span className="text-xs text-[#D4922A]">(skipped)</span>}
              </li>
            ))}
          </ul>
        </div>

        {(incomplete > 0 || skippedCount > 0) && (
          <div className="mt-4 p-3 rounded-lg border border-[#D4922A]/30 bg-[#D4922A]/10 text-xs text-[#E8D5B0]">
            You have {incomplete + skippedCount} item{incomplete + skippedCount === 1 ? '' : 's'} to complete before
            all TTB compliance features activate. Finish them in Compliance Settings.
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-[#BA7517] text-white font-medium hover:bg-[#A6661A] transition"
          >
            OPEN MY DASHBOARD →
          </Link>
          <Link
            href="/barrels"
            className="px-6 py-3 rounded-lg border border-[#BA7517] text-[#BA7517] font-medium hover:bg-[#BA7517]/10 transition"
          >
            ADD MY FIRST BARREL
          </Link>
        </div>
      </div>
    </div>
  )
}
