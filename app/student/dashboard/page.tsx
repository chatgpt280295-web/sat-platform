import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, TrendingUp, GraduationCap, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, email').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Lớp học của học sinh
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id, classes(id, name, description)')
    .eq('user_id', profile.id)
  const myClasses = memberships?.map(m => m.classes as any) ?? []

  // Bài tập từ các lớp
  const classIds = memberships?.map(m => m.class_id) ?? []
  let totalAssignments = 0
  let pendingAssignments = 0

  if (classIds.length > 0) {
    const { data: ca } = await supabase
      .from('class_assignments')
      .select('assignment_id')
      .in('class_id', classIds)

    const assignmentIds = [...new Set(ca?.map(r => r.assignment_id) ?? [])]
    totalAssignments = assignmentIds.length

    if (assignmentIds.length > 0) {
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .not('finished_at', 'is', null)
        .in('assignment_id', assignmentIds)
      pendingAssignments = assignmentIds.length - (count ?? 0)
    }
  }

  // Sessions gần đây
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, finished_at, assignments(title)')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(5)

  const avgScore = sessions && sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
    : null

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="p-8 max-w-4xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-sm mb-1">{greet},</p>
        <h1 className="text-2xl font-bold mb-1">{profile.full_name} 👋</h1>
        <p className="text-blue-100 text-sm">{profile.email}</p>
      </div>

      {/* Lớp học của tôi */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-600" />
          Lớp học của tôi
        </h2>
        {myClasses.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700">
            Bạn chưa được xếp lớp. Liên hệ giáo viên để được phân lớp.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myClasses.map((cls: any) => (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cls.name}</p>
                  {cls.description && <p className="text-xs text-gray-400 mt-0.5">{cls.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Bài tập</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalAssignments}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs text-gray-500">Chưa làm</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingAssignments}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-gray-500">Điểm TB</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {avgScore !== null ? avgScore + '%' : '—'}
          </p>
        </div>
      </div>

      {/* Recent results */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Kết quả gần đây</h2>
          <Link href="/student/results" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        {(!sessions || sessions.length === 0) ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Chưa có kết quả nào. Hãy bắt đầu làm bài!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((s: any) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500 shrink-0" />
                  <p className="text-sm text-gray-800 font-medium">{s.assignments?.title ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${
                    (s.score ?? 0) >= 70 ? 'text-green-600'
                    : (s.score ?? 0) >= 50 ? 'text-yellow-600'
                    : 'text-red-500'
                  }`}>
                    {Math.round(s.score ?? 0)}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.finished_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA nếu còn bài chưa làm */}
      {pendingAssignments > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-blue-700 font-medium">
            Bạn còn <strong>{pendingAssignments}</strong> bài tập chưa làm
          </p>
          <Link href="/student/assignments"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            Làm ngay →
          </Link>
        </div>
      )}
    </div>
  )
}
