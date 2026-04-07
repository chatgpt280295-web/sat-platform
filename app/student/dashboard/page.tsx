import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList, TrendingUp, GraduationCap, Clock, CalendarCheck } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function ScoreBar({ value, color = 'bg-blue-500' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{value}%</span>
    </div>
  )
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, email, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Classes
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id, classes(id, name, description)')
    .eq('user_id', profile.id)
  const myClasses = memberships?.map(m => m.classes as any) ?? []
  const classIds  = memberships?.map(m => m.class_id) ?? []

  // Assignments
  let totalAssignments = 0, pendingAssignments = 0
  if (classIds.length > 0) {
    const { data: ca } = await supabase
      .from('class_assignments').select('assignment_id').in('class_id', classIds)
    const ids = Array.from(new Set((ca ?? []).map((r: any) => r.assignment_id)))
    totalAssignments = ids.length
    if (ids.length > 0) {
      const { count } = await supabase
        .from('sessions').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).not('finished_at', 'is', null).in('assignment_id', ids)
      pendingAssignments = ids.length - (count ?? 0)
    }
  }

  // Recent sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, finished_at, assignments(title)')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(6)

  const avgScore = sessions && sessions.length > 0
    ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / sessions.length)
    : null

  // Attendance
  const { data: attendances } = await supabase
    .from('attendances').select('status').eq('user_id', profile.id)
  const totalAtt   = attendances?.length ?? 0
  const presentCnt = attendances?.filter((a: any) => ['present', 'late'].includes(a.status ?? '')).length ?? 0
  const attRate    = totalAtt > 0 ? Math.round(presentCnt / totalAtt * 100) : null

  // Intake / diagnostic
  const { data: diagnostic } = await supabase
    .from('diagnostic_results')
    .select('math_score, rw_score, total_score, tier')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Top errors
  const { data: errors } = await supabase
    .from('error_logs').select('skill, domain').eq('user_id', profile.id)
  const skillMap: Record<string, number> = {}
  errors?.forEach((e: any) => {
    const k = e.skill || e.domain || 'Khác'
    skillMap[k] = (skillMap[k] ?? 0) + 1
  })
  const topErrors = Object.entries(skillMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([skill, count]) => ({ skill, count }))

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  const tierLabel: Record<number, string> = { 1: 'Cơ bản', 2: 'Trung bình', 3: 'Khá', 4: 'Giỏi' }

  return (
    <div className="p-8 max-w-4xl">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-sm mb-1">{greet},</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">{profile.full_name} 👋</h1>
            <p className="text-blue-100 text-sm">{profile.email}</p>
          </div>
          {(profile.tier ?? diagnostic?.tier) && (
            <div className="text-right">
              <p className="text-blue-200 text-xs mb-1">Năng lực</p>
              <span className="inline-flex px-3 py-1 rounded-lg text-sm font-bold bg-white/20 text-white">
                Tier {profile.tier ?? (diagnostic as any)?.tier} — {tierLabel[profile.tier ?? (diagnostic as any)?.tier ?? 1] ?? ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Intake CTA */}
      {!profile.tier && !diagnostic && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Bạn chưa làm bài kiểm tra đầu vào</p>
            <p className="text-amber-600 text-xs mt-0.5">Hoàn thành để xác định tier và nhận lộ trình học phù hợp</p>
          </div>
          <Link href="/student/intake"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Làm ngay →
          </Link>
        </div>
      )}

      {/* Intake scores */}
      {diagnostic && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Điểm đầu vào (Intake Test)
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Math</p>
              <p className="text-2xl font-bold text-blue-700">{(diagnostic as any).math_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Reading &amp; Writing</p>
              <p className="text-2xl font-bold text-purple-700">{(diagnostic as any).rw_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 800</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Tổng SAT</p>
              <p className="text-3xl font-bold text-gray-900">{(diagnostic as any).total_score ?? '—'}</p>
              <p className="text-xs text-gray-400">/ 1600</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: ClipboardList, color: 'blue', label: 'Bài tập',  value: totalAssignments },
          { icon: Clock,         color: 'orange', label: 'Chưa làm', value: pendingAssignments },
          { icon: TrendingUp,    color: 'green',  label: 'Điểm TB',  value: avgScore !== null ? avgScore + '%' : '—' },
          { icon: CalendarCheck, color: 'teal',   label: 'Điểm danh', value: attRate !== null ? attRate + '%' : '—' },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className={`w-8 h-8 bg-${color}-50 rounded-xl flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Recent results */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Kết quả gần đây</h2>
            <Link href="/student/results" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả →
            </Link>
          </div>
          {(!sessions || sessions.length === 0) ? (
            <div className="py-10 text-center text-gray-400 text-sm">Chưa có kết quả nào. Hãy bắt đầu làm bài!</div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              {(sessions as any[]).slice(0, 5).map((s: any) => (
                <div key={s.id}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span className="truncate max-w-[160px] font-medium">{s.assignments?.title ?? '—'}</span>
                    <span className="text-gray-400">{new Date(s.finished_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <ScoreBar
                    value={Math.round(s.score ?? 0)}
                    color={(s.score ?? 0) >= 70 ? 'bg-green-500' : (s.score ?? 0) >= 50 ? 'bg-yellow-400' : 'bg-red-400'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error analysis */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Top lỗi cần cải thiện</h2>
          </div>
          {topErrors.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Làm bài tập để xem phân tích lỗi</div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {topErrors.map((err, i) => (
                <div key={err.skill}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`}>{i + 1}</span>
                      <span className="font-medium text-gray-700">{err.skill}</span>
                    </div>
                    <span className="text-gray-400">{err.count} lỗi</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                      style={{ width: topErrors[0]?.count ? `${Math.round((err.count / topErrors[0].count) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
              {errors && errors.length > 0 && (
                <p className="text-xs text-gray-400 pt-1">Tổng {errors.length} lỗi được ghi nhận</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Classes */}
      {myClasses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-600" />Lớp học của tôi
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {myClasses.map((cls: any) => (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{cls.name}</p>
                  {cls.description && <p className="text-xs text-gray-400 mt-0.5">{cls.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingAssignments > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
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
