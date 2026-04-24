export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatMonths(months: number): string {
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem ? `${years}yr ${rem}mo` : `${years}yr`
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function formatCurrency(n: number | null): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}
