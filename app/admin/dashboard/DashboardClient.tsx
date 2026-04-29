'use client'

// ── Types & Imports ────────────────────────────────────────────────────────────
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, BookOpen, ClipboardList, ShoppingCart, TrendingUp } from 'lucide-react'

interface Stats {
  totalStudents:    number
  totalEnrollments: number
  totalAssignments: number
  pendingOrders:    number
}

interface Props {
  stats:          Stats
  courses:        any[]
  recentSessions: any[]
}

// ── Render ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({ stats, courses, recentSessions: initSessions }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [courseStats, setCourseStats]       = useState<any>(null)
  const [loading, setLoading]               = useState(false)
  const [sessions, setSessions]             = useState(initSessions)

  async function handleCourseFilter(courseId: string) {
    setSelectedCourse(courseId)
    if (courseId === 'all') {
      setCourseStats(null)
      setSessions(initSessions)
      return
    }

    setLoading(true)
    const supabase = createClient()

    const [
      { count: enrollCount },
      { data: courseSessions },
    ] = await Promise.all([
      supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('course_id', courseId),
      supabase.from('sessions')
        .select('id, score, finished_at, users(full_name), assignments!inner(title, course_id)')
        .not('finished_at', 'is', null)
        .eq('assignments.course_id', courseId)
        .order('finished_at', { ascending: false })
        .limit(20),
    ])

    const scored = (courseSessions ?? []).filter((s: any) => s.score !== null)
    setCourseStats({
      enrollCount: enrollCount ?? 0,
      sessionCount: courseSessions?.length ?? 0,
      avgScore: scored.length
        ? Math.round(scored.reduce((a: number, s: any) => a + s.score, 0) / scored.length)
        : null,
    })
    setSessions(courseSessions ?? [])
    setLoading(false)
  }

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name ?? 'Tất cả'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Tổng quan hệ thống</p>
        </div>

        {/* Course filter */}
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-gray-400" />
          <select
            value={selectedCourse}
            onChange={e => handleCourseFilter(e.target.value)}
            className="input min-w-[180px]">
            <option value="all">Tất cả khóa học</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {selectedCourse !== 'all' && courseStats ? (
          <>
            <StatCard icon={Users}        label="Học viên ghi danh" value={courseStats.enrollCount}  color="blue"   />
            <StatCard icon={ClipboardList} label="Lượt làm bài"     value={courseStats.sessionCount} color="purple" />
            <StatCard icon={TrendingUp}   label="Điểm TB"           value={courseStats.avgScore !== null ? courseStats.avgScore + '%' : '—'} color="green" />
            <StatCard icon={BookOpen}     label="Khóa đang xem"     value={selectedCourseName}       color="orange" small />
          </>
        ) : (
          <>
            <StatCard icon={Users}         label="Học viên"      value={stats.totalStudents}    color="blue"   />
            <StatCard icon={BookOpen}      label="Ghi danh"      value={stats.totalEnrollments} color="purple" />
            <StatCard icon={ClipboardList} label="Bài tập"       value={stats.totalAssignments} color="green"  />
            <StatCard icon={ShoppingCart}  label="Đơn chờ duyệt" value={stats.pendingOrders}    color="orange" />
          </>
        )}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-gray-900 text-sm">
            Kết quả gần đây {selectedCourse !== 'all' ? `— ${selectedCourseName}` : ''}
          </h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chưa có kết quả nào</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Bài tập</th>
                  <th>Điểm</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium text-gray-900">{s.users?.full_name ?? '—'}</td>
                    <td className="text-gray-600">{s.assignments?.title ?? '—'}</td>
                    <td>
                      <span className={`font-semibold ${
                        (s.score ?? 0) >= 70 ? 'text-green-600' : (s.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-500'
                      }`}>{s.score !== null ? Math.round(s.score) + '%' : '—'}</span>
                    </td>
                    <td className="text-gray-400">
                      {s.finished_at ? new Date(s.finished_at).toLocaleString('vi-VN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, small }: {
  icon: any; label: string; value: any; color: string; small?: boolean
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`font-bold text-gray-900 mt-1 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}
