import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Root redirect
  if (pathname === '/') {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    const { data: profile } = await supabase
      .from('users').select('role, status').eq('auth_id', user.id).single()
    if (!profile || profile.status !== 'active') {
      return NextResponse.redirect(new URL('/locked', request.url))
    }
    const dest = profile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Public routes
  if (pathname === '/login' || pathname === '/locked') {
    return supabaseResponse
  }

  // Protected routes — must be logged in
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('users').select('role, status').eq('auth_id', user.id).single()

  if (!profile || profile.status !== 'active') {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  if (pathname.startsWith('/admin') && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/student/dashboard', request.url))
  }
  if (pathname.startsWith('/student') && profile.role !== 'student') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
