import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return null

  // Assignments from student's classes
  const { data: classAssignmentRows } = await supabase
    .from('class_members')
    .select(`
      classes(
        name,
        class_assignments(
          assignments(id, title, description, due_date)
        )
      )
    `)
    .eq('user_id', profile.id)

  // Flatten assignments with class name
  const assignmentMap = new Map<string, { assignment: any; className: string }>()
  for (const cm of classAssignmentRows ?? []) {
    const cls = cm.classes as any
    for (const ca of cls?.class_assignments ?? []) {
      const a = ca.assignments
      if (a && !assignmentMap.has(a.id)) {
        assignmentMap.set(a.id, { assignment: a, className: cls.name })
      }
    }
  }
  const assignments = Array.from(assignmentMap.values())

  // Get sessions for this student
  const { data: sessions } = await supabase
    .from('sessions')
    .select('assignment_id, score, finished_at')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)

  const sessionMap = new Map(sessions?.map(s => [s.assignment_id, s]) ?? [])
  const now = new Date()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">{assignments.length} bài tập</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có bài tập nào</p>
          <p className="text-gray-400 text-sm mt-1">Bài tập sẽ xuất hiện khi giáo viên giao cho lớp của bạn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(({ assignment: a, className }) => {
            const session  = sessionMap.get(a.id)
            const done     = !!session
            const overdue  = !done && a.due_date && new Date(a.due_date) < now

            return (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? 'bg-green-100' : overdue ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {done
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <Clock className={`w-5 h-5 ${overdue ? 'text-red-500' : 'text-blue-600'}`} />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{className}</span>
                      {done && (
                        <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                          {Math.round(session.score ?? 0)}%
                        </span>
                      )}
                      {overdue && !done && (
                        <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">Quá hạn</span>
                      )}
                    </div>
                    {a.due_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Hạn nộp: {new Date(a.due_date).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                <Link href={`/student/assignments/${a.id}`}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    done
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {done ? 'Xem lại' : 'Làm bài'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
