import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default async function StudentResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name').eq('auth_id', user.id).single()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, total_questions, correct_count, started_at, finished_at, assignments(title)')
    .eq('user_id', profile?.id ?? '')
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  const avgScore = sessions?.length
    ? Math.round(sessions.reduce((s, r) => s + (r.score ?? 0), 0) / sessions.length)
    : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kết quả học tập</h1>
          <p className="page-subtitle">{sessions?.length ?? 0} bài đã hoàn thành</p>
        </div>
      </div>

      {/* Summary stats */}
      {sessions && sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="stat-icon bg-blue-50"><TrendingUp size={20} className="text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Bài đã làm</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{sessions.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-emerald-50"><CheckCircle size={20} className="text-emerald-600"/></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Điểm TB</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{avgScore}%</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-purple-50"><TrendingUp size={20} className="text-purple-600"/></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Điểm cao nhất</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {Math.max(...(sessions.map(s => s.score ?? 0)))}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results list */}
      {!sessions?.length ? (
        <div className="card">
          <div className="empty-state py-20">
            <TrendingUp size={48} className="text-gray-200 mb-4"/>
            <p className="text-gray-400 font-medium">Chưa có kết quả nào</p>
            <p className="text-gray-400 text-sm mt-1">Hoàn thành bài tập để xem kết quả ở đây</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Bài tập</th>
                  <th>Điểm</th>
                  <th>Đúng / Tổng</th>
                  <th>Thời gian hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const pct = s.score ?? 0
                  return (
                    <tr key={s.id}>
                      <td className="font-medium text-gray-900">
                        {(s.assignments as any)?.title ?? 'Bài luyện tập'}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 progress-track">
                            <div className={`progress-fill ${pct >= 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}/>
                          </div>
                          <span className={`text-sm font-bold ${pct >= 70 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-600">
                        <span className="text-emerald-600 font-semibold">{s.correct_count}</span>
                        <span className="text-gray-400"> / {s.total_questions}</span>
                      </td>
                      <td className="text-xs text-gray-400">
                        {s.finished_at ? formatDateTime(s.finished_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
