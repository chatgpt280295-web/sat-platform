'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen, LayoutDashboard, Users, HelpCircle,
  ClipboardList, GraduationCap, CalendarCheck, BarChart2, LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/classes',     label: 'Lớp học',     icon: GraduationCap   },
  { href: '/admin/attendance',  label: 'Điểm danh',   icon: CalendarCheck   },
  { href: '/admin/users',       label: 'Học viên',    icon: Users           },
  { href: '/admin/questions',   label: 'Câu hỏi',     icon: HelpCircle      },
  { href: '/admin/assignments', label: 'Bài tập',     icon: ClipboardList   },
  { href: '/admin/reports',     label: 'Báo cáo',     icon: BarChart2       },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none">SAT Platform</div>
            <div className="text-xs text-gray-400 mt-0.5">Quản trị viên</div>
          </div>
        </div>
      </div>
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
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={logout} className="nav-item nav-item-default w-full">
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
