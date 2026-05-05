import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Master admin double-lock: cookie key must match STILL_ADMIN_KEY
  if (pathname.startsWith('/master') || pathname.startsWith('/api/admin/master')) {
    const adminKey = process.env.STILL_ADMIN_KEY
    const cookieKey = req.cookies.get('x-still-admin-key')?.value
    const headerKey = req.headers.get('x-still-admin-key')
    if (!adminKey || (cookieKey !== adminKey && headerKey !== adminKey)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api')
  const isStoryPage = pathname.match(/^\/batches\/[^/]+\/story/)
  const isBarrelStory = pathname.match(/^\/barrel\/[^/]/)
  const isConsumerPage = pathname.startsWith('/adopt/') ||
    pathname.startsWith('/passport/') ||
    pathname.startsWith('/bottle/') ||
    pathname.startsWith('/taste/') ||
    pathname.startsWith('/drops/') ||
    pathname.startsWith('/flights/') ||
    pathname.startsWith('/widget/') ||
    pathname.startsWith('/trail/') ||
    pathname.startsWith('/checkin/') ||
    pathname.startsWith('/profile/') ||
    pathname === '/collection'
  const isDistilleryProfile = /^\/distillery\/[^/]/.test(pathname)

  if (!user && !isPublic && !isApi && !isStoryPage && !isBarrelStory && !isConsumerPage && !isDistilleryProfile) {
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Block writes during admin impersonation
  const viewingAs = req.cookies.get('viewing_as_distillery_id')?.value
  if (viewingAs && isApi && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const allowedWriteApis = ['/api/admin/', '/api/auth/']
    const isAllowed = allowedWriteApis.some((prefix) => pathname.startsWith(prefix))
    if (!isAllowed) {
      return NextResponse.json({ error: 'Write operations blocked during admin view' }, { status: 403 })
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
