export interface WalkthroughStep {
  id: string
  title: string
  body: string
  targetSelector: string | null
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: string
  highlight?: boolean
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Still.',
    body: `You're looking at the command center for your entire distillery operation. We'll walk you through every feature in about 3 minutes. Ready? Let's go.`,
    targetSelector: null,
    placement: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    body: `At a glance: total barrels, aging inventory by year, recent voice notes, and any barrels hitting their predicted peak window this month. Everything you need before you walk out to the rackhouse.`,
    targetSelector: '[data-tour="dashboard-overview"]',
    placement: 'bottom',
    action: '/dashboard',
  },
  {
    id: 'barrel-list',
    title: 'Your Full Barrel Inventory',
    body: `Every barrel in your operation, live. Filter by status, location, age, proof, or mash bill. Each row is a living record — tap any barrel to open its full timeline.`,
    targetSelector: '[data-tour="barrel-list-table"]',
    placement: 'top',
    action: '/barrels',
  },
  {
    id: 'smart-search',
    title: 'AI-Powered Smart Search',
    body: `Don't browse — just describe what you're looking for. Say "wheated mash, 6 years, high proof, warehouse B" and the AI pulls exactly the right barrels. It reads your voice notes and understands context, not just keywords.`,
    targetSelector: '[data-tour="smart-search-input"]',
    placement: 'bottom',
    highlight: true,
  },
  {
    id: 'add-barrel',
    title: 'Add a Barrel — or Just Tap One',
    body: `New barrel? Fill out the entry form here: cooperage type, mash bill, entry proof, warehouse location, fill date. Once entered, tap "Link NFC Tag" and hold your phone to the NFC chip on the barrel — it's linked permanently.`,
    targetSelector: '[data-tour="add-barrel-button"]',
    placement: 'left',
    highlight: true,
  },
  {
    id: 'barrel-detail',
    title: 'The Full Barrel Record',
    body: `Every data point on one screen: fill date, cooperage, mash bill, proof at entry, current estimated proof, location, tasting note timeline, AI-extracted tags, compliance status, angel's share loss, and predictive aging window.`,
    targetSelector: '[data-tour="barrel-detail-card"]',
    placement: 'right',
  },
  {
    id: 'voice-notes',
    title: 'Voice Notes → Structured Data',
    body: `This is the rackhouse killer feature. Tap the mic, speak naturally — "Barrel 47, strong vanilla and caramel, slight oak, pulling in about 6 months, proof feels like it's around 118." The AI transcribes it and automatically extracts and tags every data point.`,
    targetSelector: '[data-tour="voice-note-recorder"]',
    placement: 'top',
    highlight: true,
  },
  {
    id: 'heatmap',
    title: 'Warehouse Heatmap',
    body: `A visual layout of your entire rackhouse. Color-coded by barrel status: green (on track), amber (approaching peak), red (overdue), grey (empty). Click any cell to jump to that barrel's record.`,
    targetSelector: '[data-tour="warehouse-heatmap"]',
    placement: 'top',
    action: '/warehouse',
  },
  {
    id: 'blend-ai',
    title: 'Blend AI',
    body: `Tell the AI what flavor profile you're building toward. It analyzes every barrel's tasting history and recommends the optimal combination — with predicted resulting proof, flavor signature, and volume yield.`,
    targetSelector: '[data-tour="blend-ai-button"]',
    placement: 'left',
    action: '/blend',
    highlight: true,
  },
  {
    id: 'ttb-compliance',
    title: 'TTB Compliance Dashboard',
    body: `Every barrel record automatically populates your TTB compliance data. Production logs, storage records, and processing records are maintained in real time. Export audit-ready reports, review your monthly operations summary (Form 5110.40 support), and track proof gallon totals.`,
    targetSelector: '[data-tour="ttb-compliance-nav"]',
    placement: 'right',
    action: '/compliance',
  },
  {
    id: 'story-pages',
    title: 'QR Barrel Story Pages',
    body: `Every barrel gets a public-facing story page — accessible via QR code on the bottle label. Three states: aging, available, and archive. Your marketing department lives on this page.`,
    targetSelector: '[data-tour="qr-story-preview"]',
    placement: 'top',
  },
  {
    id: 'drop-events',
    title: 'Drop Events',
    body: `Planning a barrel release? Create a drop event — set the date, featured barrels, allocation limits, and description. Consumers get notified, can RSVP, and the event page auto-publishes on your public profile.`,
    targetSelector: '[data-tour="drop-events-section"]',
    placement: 'top',
    action: '/drops',
  },
  {
    id: 'consumer-profiles',
    title: 'Consumer Profiles & Badges',
    body: `Whiskey enthusiasts create consumer accounts and connect to your distillery. They earn badges for check-ins, barrel sponsorships, tasting notes, and trail completions. Your most loyal fans get a profile — and you get first-party data.`,
    targetSelector: '[data-tour="consumer-profiles-nav"]',
    placement: 'right',
  },
  {
    id: 'veterans-trail',
    title: 'Veterans Whiskey Trail',
    body: `A regional discovery network for veteran-owned distilleries. Consumers check in at member distilleries, earn trail badges, and unlock exclusive releases. It drives real foot traffic and builds community between distilleries — not competition.`,
    targetSelector: '[data-tour="veterans-trail-section"]',
    placement: 'top',
  },
  {
    id: 'sponsorships',
    title: 'Barrel Sponsorships',
    body: `Four sponsorship tiers: Barrel Club, Single Barrel Select, Master Distiller Reserve, and Legacy. Sponsors get their name on a barrel, updates as it ages, early access to allocation, and a private story page. A genuine revenue stream from your most engaged fans.`,
    targetSelector: '[data-tour="sponsorship-tiers"]',
    placement: 'top',
  },
  {
    id: 'complete',
    title: "That's the full Still platform.",
    body: `Tap. Talk. Track. TTB-ready from day one. You've seen every major feature. Now it's yours to explore — or we can walk through your specific setup.`,
    targetSelector: null,
    placement: 'center',
    action: '/dashboard',
  },
]
