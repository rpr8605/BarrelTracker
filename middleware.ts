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
  const publicPaths = ['/login', '/onboarding']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  const isApi = pathname.startsWith('/api')
  const isStoryPage = pathname.match(/^\/batches\/[^/]+\/story/)

  if (!user && !isPublic && !isApi && !isStoryPage) {
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
