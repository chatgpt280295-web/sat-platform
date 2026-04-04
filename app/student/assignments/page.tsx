import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { ClipboardList, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, created_at, assignment_questions(count)')
    .order('created_at', { ascending: false })

  // Get user's completed sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('assignment_id, score, finished_at')
    .eq('user_id', profile?.id ?? '')
    .not('finished_at', 'is', null)

  const doneMap = new Map(sessions?.map(s => [s.assignment_id, s]) ?? [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bài tập</h1>
          <p className="page-subtitle">Danh sách bài tập được giao</p>
        </div>
      </div>

      {!assignments?.length ? (
        <div className="card">
          <div className="empty-state py-20">
            <ClipboardList size={48} className="text-gray-200 mb-4"/>
            <p className="text-gray-400 font-medium">Chưa có bài tập nào</p>
            <p className="text-gray-400 text-sm mt-1">Giáo viên sẽ giao bài tập sớm!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => {
            const done     = doneMap.get(a.id)
            const qCount   = (a.assignment_questions as any)?.[0]?.count ?? 0
            const overdue  = a.due_date && !done && new Date(a.due_date) < new Date()
            const pct      = done?.score ?? null

            return (
              <div key={a.id} className={`card transition-shadow hover:shadow-md ${done ? 'opacity-90' : ''}`}>
                <div className="card-body flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? 'bg-emerald-100' : 'bg-blue-50'
                  }`}>
                    {done
                      ? <CheckCircle size={22} className="text-emerald-600"/>
                      : <ClipboardList size={22} className="text-blue-600"/>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900">{a.title}</h3>
                      <span className="badge badge-blue">{qCount} câu</span>
                      {done && pct !== null && (
                        <span className={`badge ${pct >= 70 ? 'badge-green' : pct >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                          {pct}%
                        </span>
                      )}
                      {overdue && <span className="badge badge-red">Quá hạn</span>}
                    </div>
                    {a.description && <p className="text-sm text-gray-500 truncate">{a.description}</p>}
                    {a.due_date && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        <Clock size={11}/> Hạn: {formatDate(a.due_date)}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {done ? (
                      <Link href={`/student/results`} className="btn-secondary text-sm">
                        Xem kết quả
                      </Link>
                    ) : qCount > 0 ? (
                      <Link href={`/student/assignments/${a.id}`} className="btn-primary text-sm">
                        Làm bài →
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Chưa có câu hỏi</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
