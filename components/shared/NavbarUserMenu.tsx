'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

interface Props {
  fullName: string
  role: 'admin' | 'student'
}

export default function NavbarUserMenu({ fullName, role }: Props) {
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  const dashboardHref = role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
  const initial = fullName.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-2">
      <Link href={dashboardHref} className="flex items-center gap-2 btn-secondary text-sm">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initial}
        </div>
        <span className="max-w-[140px] truncate hidden sm:inline">{fullName}</span>
      </Link>
      <button onClick={logout} className="btn-secondary text-sm px-2.5" title="Đăng xuất">
        <LogOut size={15} />
      </button>
    </div>
  )
}
