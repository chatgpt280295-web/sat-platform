import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { TIER_LABELS } from '@/types'
import { ClipboardList, TrendingUp, Target, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('full_name, email, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: assignments } = await supabase
    .from('assignments').select('id, title, due_date, created_at')
    .order('created_at', { ascending: false }).limit(5)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, total_questions, correct_count, finished_at, assignments(title)')
    .eq('user_id', user.id).not('finished_at', 'is', null)
    .order('finished_at', { ascending: false }).limit(5)

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-sm mb-1">{greet},</p>
        <h1 className="text-2xl font-bold mb-1">{profile.full_name} 👋</h1>
        <p className="text-blue-100 text-sm">{profile.email}</p>
        {profile.tier && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
            <Target size={14}/>
            <span className="text-sm font-medium">{TIER_LABELS[profile.tier as keyof typeof TIER_LABELS]}</span>
          </div>
        )}
      </div>

      {!profile.tier && (
        <div className="card mb-6 border-amber-200 bg-amber-50">
          <div className="card-body flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Target size={20} className="text-amber-600"/>
            </div>
            <div>
              <p className="font-semibold text-amber-900">Bạn chưa có Tier học tập</p>
              <p className="text-sm text-amber-700 mt-0.5">Liên hệ giáo viên để được phân loại và nhận bài tập phù hợp.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-600"/>
              <h2 className="text-sm font-semibold text-gray-900">Bài tập</h2>
            </div>
            <Link href="/student/assignments" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {assignments?.length ? assignments.map(a => (
              <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.title}</p>
                  {a.due_date && <p className="text-xs text-gray-400 mt-0.5">Hạn: {formatDate(a.due_date)}</p>}
                </div>
                <Link href={`/student/assignments/${a.id}`} className="btn-primary text-xs px-3 py-1.5">Làm bài</Link>
              </div>
            )) : (
              <div className="empty-state py-10">
                <BookOpen size={28} className="text-gray-200 mb-2"/>
                <p className="text-sm text-gray-400">Chưa có bài tập nào</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600"/>
              <h2 className="text-sm font-semibold text-gray-900">Kết quả gần đây</h2>
            </div>
            <Link href="/student/results" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {sessions?.length ? sessions.map(s => {
              const pct = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0
              return (
                <div key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[60%]">
                      {(s.assignments as any)?.title ?? 'Bài luyện tập'}
                    </p>
                    <span className={`text-sm font-bold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="progress-track mb-1">
                    <div className={`progress-fill ${pct >= 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}/>
                  </div>
                  <p className="text-xs text-gray-400">{s.correct_count}/{s.total_questions} câu đúng</p>
                </div>
              )
            }) : (
              <div className="empty-state py-10">
                <TrendingUp size={28} className="text-gray-200 mb-2"/>
                <p className="text-sm text-gray-400">Chưa có kết quả nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
