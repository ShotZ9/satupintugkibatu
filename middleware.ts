import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Ambil session
  const {
    data: { session }
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // Rute yang perlu login
  const protectedRoutes = ['/majelis', '/admin']

  const isProtected = protectedRoutes.some((r) =>
    path.startsWith(r)
  )

  // Belum login → login page
  if (isProtected && !session) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Kalau sudah login, cek role
  if (session && isProtected) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      )
    }

    // Proteksi role
    if (
      path.startsWith('/majelis') &&
      profile.role !== 'majelis'
    ) {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      )
    }

    if (
      path.startsWith('/admin') &&
      profile.role !== 'admin'
    ) {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      )
    }
  }

  return res
}

export const config = {
  matcher: ['/majelis/:path*', '/admin/:path*']
}