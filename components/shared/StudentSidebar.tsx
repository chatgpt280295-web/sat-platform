'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, BarChart2,
  Settings, ShoppingBag, Home, LogOut, User, GraduationCap, ClipboardList,
} from 'lucide-react'

const NAV = [
  { href: '/student/dashboard',   label: 'Dashboard',         icon: Home          },
  { href: '/student/courses',     label: 'Khóa học của tôi',  icon: GraduationCap },
  { href: '/student/assignments', label: 'Bài tập',           icon: ClipboardList },
  { href: '/student/orders',      label: 'Đơn hàng',          icon: ShoppingBag   },
  { href: '/student/results',     label: 'Kết quả',           icon: BarChart2     },
  { href: '/student/profile',     label: 'Hồ sơ',             icon: User          },
  { href: '/student/settings',    label: 'Cài đặt',           icon: Settings      },
]

export default function StudentSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      <Link href="/" className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5 hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm leading-none">SAT Platform</div>
          <div className="text-xs text-gray-400 mt-0.5">Học viên</div>
        </div>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`nav-item ${active ? 'nav-item-active' : 'nav-item-default'}`}>
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link href="/" className="nav-item nav-item-default">
          <Home size={17} />
          <span>Trang chủ</span>
        </Link>
        <button onClick={logout} className="nav-item nav-item-default w-full">
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
