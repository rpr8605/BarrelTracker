import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { PostHogProvider } from '@/components/analytics/PostHogProvider'

export const metadata: Metadata = {
  title: 'Still — Distillery Management',
  description: 'Smart barrel tracking and blending for craft distilleries',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#BA7517',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  )
}
