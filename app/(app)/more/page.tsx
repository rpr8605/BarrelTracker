import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { 
  History, 
  Tag as TagIcon, 
  Scan, 
  Boxes, 
  Package, 
  Settings, 
  ShieldCheck, 
  Sparkles,
  BarChart3,
  Warehouse,
  FlaskConical,
  Beaker,
  FileText
} from 'lucide-react'

const MORE_LINKS = [
  { href: '/batches', label: 'Story Mode (Batches)', icon: Boxes, description: 'Turn production data into consumer narratives.' },
  { href: '/smart-tags', label: 'Smart Tags', icon: TagIcon, description: 'Manage QR, NFC, and RFID asset links.' },
  { href: '/warehouse', label: 'Warehouse Heatmap', icon: Warehouse, description: 'Visual rickhouse monitoring and movement.' },
  { href: '/blend', label: 'Blending AI', icon: Sparkles, description: 'Predictive blending and profile matching.' },
  { href: '/products', label: 'Products & SKUs', icon: Package, description: 'Catalog your finished goods and labels.' },
  { href: '/npd-lab', label: 'NPD Lab', icon: FlaskConical, description: 'New product development and formulas.' },
  { href: '/processing', label: 'Processing Logs', icon: Beaker, description: 'Bottling runs and remnant records.' },
  { href: '/analytics', label: 'Business Analytics', icon: BarChart3, description: 'Sales, adoption, and production trends.' },
  { href: '/tax', label: 'Excise Tax Center', icon: ShieldCheck, description: 'Automated tax-determined removals.' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Distillery profile and sensor alerts.' },
]

export default function MorePage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">More Features</h1>
        <p className="text-[var(--color-text-muted)]">Explore the full power of the Still platform.</p>
      </div>

      <div className="grid gap-3">
        {MORE_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="p-4 hover:border-primary transition-all group flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <link.icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm leading-none mb-1">{link.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{link.description}</p>
              </div>
              <span className="text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform">›</span>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1 italic">Demo Tip</p>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          The "Story Mode" for a barrel is generated from its production logs and voice notes. 
          View Barrel #0008 to see a live example.
        </p>
      </div>
    </div>
  )
}
