# Run this from: SAT platform\sat-platform\
# Usage: powershell -ExecutionPolicy Bypass -File setup_pages.ps1

Write-Host "Creating SAT Platform page files..." -ForegroundColor Cyan

function Write-File($path, $content) {
    $dir = Split-Path $path -Parent
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText((Resolve-Path -Path "." | Join-Path -ChildPath $path), $content, [System.Text.Encoding]::UTF8)
    Write-Host "  OK: $path" -ForegroundColor Green
}

# ─── app/admin/dashboard/page.tsx ───────────────────────────────────────────
Write-File "app/admin/dashboard/page.tsx" @'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { TIER_LABELS } from '@/types'
import Link from 'next/link'
import { Users, BookOpen, ClipboardList, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: totalQuestions },
    { count: totalAssignments },
    { data: recentStudents },
    { data: tierRaw },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('id, full_name, email, tier, status, created_at')
      .eq('role', 'student').order('created_at', { ascending: false }).limit(6),
    supabase.from('users').select('tier').eq('role', 'student').eq('status', 'active').not('tier', 'is', null),
  ])

  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  tierRaw?.forEach(u => { if (u.tier) tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1 })
  const maxTier = Math.max(1, ...Object.values(tierCounts))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống SAT Platform</p>
        </div>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng học viên',  value: totalStudents    ?? 0, icon: Users,         bg: 'bg-blue-50',    color: 'text-blue-600'    },
          { label: 'Đang hoạt động', value: activeStudents   ?? 0, icon: TrendingUp,    bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Câu hỏi',        value: totalQuestions   ?? 0, icon: BookOpen,      bg: 'bg-purple-50',  color: 'text-purple-600'  },
          { label: 'Bài tập',        value: totalAssignments ?? 0, icon: ClipboardList, bg: 'bg-amber-50',   color: 'text-amber-600'   },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${bg}`}><Icon size={20} className={color} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="card col-span-1">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900">Phân bố Tier</h2>
          </div>
          <div className="card-body space-y-4">
            {([1, 2, 3, 4] as const).map(tier => {
              const count = tierCounts[tier]
              const pct   = maxTier > 0 ? (count / maxTier) * 100 : 0
              const fills = ['bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-purple-400']
              return (
                <div key={tier}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-600">{TIER_LABELS[tier]}</span>
                    <span className="text-xs font-bold text-gray-900 tabular-nums">{count}</span>
                  </div>
                  <div className="progress-track">
                    <div className={`progress-fill ${fills[tier - 1]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-gray-400 pt-1">
              {Object.values(tierCounts).reduce((a, b) => a + b, 0)} học viên có Tier
            </p>
          </div>
        </div>

        <div className="card col-span-2">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-gray-900">Học viên mới nhất</h2>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:underline font-medium">Xem tất cả →</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Họ tên</th><th>Email</th><th>Tier</th><th>Trạng thái</th><th>Ngày tham gia</th></tr></thead>
              <tbody>
                {recentStudents?.map(s => (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-900">{s.full_name}</td>
                    <td className="text-gray-500 text-xs">{s.email}</td>
                    <td>{s.tier ? <span className="badge badge-blue">Tier {s.tier}</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                    <td>{s.status === 'active' ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                    <td className="text-gray-400 text-xs">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
                {!recentStudents?.length && (
                  <tr><td colSpan={5}><div className="empty-state py-10"><Users size={32} className="text-gray-200 mb-2" /><p className="text-sm text-gray-400">Chưa có học viên nào</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
'@

