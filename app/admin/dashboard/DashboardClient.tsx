'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, HelpCircle, ClipboardList, GraduationCap, TrendingUp } from 'lucide-react'

interface Props {
  stats: { totalStudents: number; totalQuestions: number; totalAssignments: number }
  classes: any[]
  recentSessions: any[]
}

export default function DashboardClient({ stats, classes, recentSessions: initSessions }: Props) {
  const [selectedClass, setSelectedClass]   = useState<string>('all')
  const [classStats, setClassStats]         = useState<any>(null)
  const [loadingClass, setLoadingClass]     = useState(false)
  const [sessions, setSessions]             = useState(initSessions)

  async function handleClassFilter(classId: string) {
    setSelectedClass(classId)
    if (classId === 'all') {
      setClassStats(null)
      setSessions(initSessions)
      return
    }
    setLoadingClass(true)
    const supabase = createClient()

    const [
      { count: memberCount },
      { data: classSessionData },
    ] = await Promise.all([
      supabase.from('class_members').select('*', { count: 'exact', head: true }).eq('class_id', classId),
      supabase.from('sessions')
        .select('id, score, finished_at, users(full_name), assignments(title)')
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(10),
    ])

    // Filter sessions by class members
    const { data: memberIds } = await supabase
      .from('class_members').select('user_id').eq('class_id', classId)
    const memberIdSet = new Set(memberIds?.map(m => m.user_id))
    const filtered = (classSessionData ?? []).filter((s: any) => memberIdSet.has(s.users?.id ?? ''))

    const scores = filtered.filter((s: any) => s.score !== null).map((s: any) => s.score)
    setClassStats({
      memberCount: memberCount ?? 0,
      sessionCount: filtered.length,
      avgScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null,
    })
    setSessions(filtered)
    setLoadingClass(false)
  }

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name ?? 'Tất cả'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống</p>
        </div>

        {/* Class filter */}
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-gray-400" />
          <select
            value={selectedClass}
            onChange={e => handleClassFilter(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[160px]">
            <option value="all">Tất cả lớp</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {selectedClass !== 'all' && classStats ? (
          <>
            <StatCard icon={Users} label="Học viên lớp" value={classStats.memberCount} color="blue" />
            <StatCard icon={ClipboardList} label="Lượt làm bài" value={classStats.sessionCount} color="purple" />
            <StatCard icon={TrendingUp} label="Điểm TB" value={classStats.avgScore !== null ? classStats.avgScore + '%' : '—'} color="green" />
            <StatCard icon={GraduationCap} label="Lớp đang xem" value={selectedClassName} color="orange" small />
          </>
        ) : (
          <>
            <StatCard icon={Users}        label="Học viên"    value={stats.totalStudents}    color="blue"   />
            <StatCard icon={HelpCircle}   label="Câu hỏi"    value={stats.totalQuestions}   color="purple" />
            <StatCard icon={ClipboardList} label="Bài tập"   value={stats.totalAssignments} color="green"  />
            <StatCard icon={GraduationCap} label="Lớp học"   value={classes.length}         color="orange" />
          </>
        )}
      </div>

      {/* Recent sessions */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">
            Kết quả gần đây {selectedClass !== 'all' ? `— ${selectedClassName}` : ''}
          </h2>
        </div>
        {loadingClass ? (
          <div className="py-12 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chưa có kết quả nào</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Học viên</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Bài tập</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Điểm</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{s.users?.full_name ?? '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{s.assignments?.title ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className={`text-sm font-semibold ${
                      (s.score ?? 0) >= 70 ? 'text-green-600' : (s.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>{s.score !== null ? Math.round(s.score) + '%' : '—'}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-400">
                    {s.finished_at ? new Date(s.finished_at).toLocaleString('vi-VN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, small }: {
  icon: any; label: string; value: any; color: string; small?: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600', orange: 'bg-orange-50 text-orange-600',
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
