import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\/api\/og.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'og-images',
          expiration: { maxAgeSeconds: 60 * 60 },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
  },
}

export default withPWA(nextConfig)
