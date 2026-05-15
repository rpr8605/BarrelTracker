import { Playfair_Display } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--font-playfair' })

export const metadata = {
  title: 'Still — Setup',
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${playfair.variable} font-sans`}>{children}</div>
}
