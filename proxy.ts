import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        }
      }
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  const isAdmin = path.startsWith('/admin')
  const isMajelis = path.startsWith('/majelis')

  // 🔐 Belum login
  if ((isAdmin || isMajelis) && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 🔍 Cek role
  if (session && (isAdmin || isMajelis)) {
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

    if (isAdmin && profile.role !== 'admin') {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      )
    }

    if (isMajelis && profile.role !== 'majelis') {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      )
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/majelis/:path*']
}