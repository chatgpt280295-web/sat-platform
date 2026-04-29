import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Public routes (không cần đăng nhập) ──────────────────────────────────────
const PUBLIC_PATHS = ['/', '/courses', '/login', '/register', '/locked']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/courses/')) return true
  return false
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as any),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── Public routes: cho qua, nhưng nếu đã login thì redirect dashboard ──────
  if (isPublicPath(pathname)) {
    // Trang login/register: nếu đã login → redirect dashboard (hoặc ?redirect=)
    if ((pathname === '/login' || pathname === '/register') && user) {
      const { data: profile } = await supabase
        .from('users').select('id, role, status').eq('auth_id', user.id).single()
      if (profile?.status === 'active') {
        const redirectTo = request.nextUrl.searchParams.get('redirect')

        // Nếu redirect tới /courses/[id] → kiểm tra intake
        if (redirectTo && /^\/courses\/[^/]+$/.test(redirectTo) && profile.role === 'student') {
          const courseId = redirectTo.split('/').pop()
          const { data: course } = await supabase
            .from('courses').select('subject').eq('id', courseId!).single()
          if (course?.subject) {
            const { data: diag } = await supabase
              .from('diagnostic_results').select('id').eq('user_id', profile.id).eq('subject', course.subject).maybeSingle()
            if (!diag) {
              const intakeUrl = new URL(`/student/intake/${course.subject}`, request.url)
              intakeUrl.searchParams.set('next', redirectTo)
              return NextResponse.redirect(intakeUrl)
            }
          }
        }

        if (redirectTo) return NextResponse.redirect(new URL(redirectTo, request.url))
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return supabaseResponse
  }

  // ── Protected routes: phải đăng nhập ─────────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('users').select('role, status').eq('auth_id', user.id).single()

  if (!profile || profile.status !== 'active') {
    return NextResponse.redirect(new URL('/locked', request.url))
  }

  // ── Role-based access control ─────────────────────────────────────────────
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
