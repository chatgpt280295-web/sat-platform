import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClipboardList, CheckCircle, Clock, GraduationCap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Lấy profile id
  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) return null

  // Bước 1: Lớp học của học sinh
  const { data: memberships } = await supabase
    .from('class_members')
    .select('class_id, classes(id, name)')
    .eq('user_id', profile.id)

  const classIds   = memberships?.map(m => m.class_id) ?? []
  const classNames = Object.fromEntries(
    (memberships ?? []).map(m => [m.class_id, (m.classes as any)?.name ?? ''])
  )

  // Bước 2: Assignment IDs từ các lớp
  let assignmentIds: string[] = []
  const assignmentClassMap: Record<string, string> = {}
  if (classIds.length > 0) {
    const { data: ca } = await supabase
      .from('class_assignments')
      .select('assignment_id, class_id')
      .in('class_id', classIds)
    for (const row of ca ?? []) {
      if (!assignmentClassMap[row.assignment_id]) {
        assignmentClassMap[row.assignment_id] = classNames[row.class_id] ?? ''
      }
    }
    assignmentIds = Object.keys(assignmentClassMap)
  }

  // Bước 3: Lấy thông tin bài tập
  const { data: assignments } = assignmentIds.length > 0
    ? await supabase
        .from('assignments')
        .select('id, title, description, due_date')
        .in('id', assignmentIds)
        .order('due_date', { ascending: true })
    : { data: [] }

  // Bước 4: Sessions đã hoàn thành
  const { data: sessions } = await supabase
    .from('sessions')
    .select('assignment_id, score, finished_at')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)

  const sessionMap = new Map(sessions?.map(s => [s.assignment_id, s]) ?? [])
  const now = new Date()

  const myClasses = memberships?.map(m => (m.classes as any)) ?? []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bài tập của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">{(assignments ?? []).length} bài tập</p>
      </div>

      {/* Lớp học của tôi */}
      {myClasses.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lớp học của bạn</p>
          <div className="flex flex-wrap gap-2">
            {myClasses.map((cls: any) => (
              <div key={cls.id}
                className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-sm font-medium">
                <GraduationCap size={14} />
                {cls.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Không có lớp */}
      {myClasses.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <GraduationCap size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Bạn chưa được xếp lớp</p>
            <p className="text-xs text-amber-600 mt-0.5">Liên hệ giáo viên để được phân lớp và nhận bài tập.</p>
          </div>
        </div>
      )}

      {/* Danh sách bài tập */}
      {(!assignments || assignments.length === 0) ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Chưa có bài tập nào</p>
          <p className="text-gray-400 text-sm mt-1">
            {myClasses.length > 0
              ? 'Giáo viên chưa giao bài tập cho lớp của bạn'
              : 'Bài tập sẽ xuất hiện sau khi bạn được xếp lớp'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a: any) => {
            const session = sessionMap.get(a.id)
            const done    = !!session
            const overdue = !done && a.due_date && new Date(a.due_date) < now
            const className = assignmentClassMap[a.id] ?? ''

            return (
              <div key={a.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between gap-4 hover:border-gray-300 transition-colors">
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
                      {className && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          {className}
                        </span>
                      )}
                      {done && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          (session.score ?? 0) >= 70 ? 'bg-green-100 text-green-700'
                          : (session.score ?? 0) >= 50 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'
                        }`}>
                          {Math.round(session.score ?? 0)}%
                        </span>
                      )}
                      {overdue && !done && (
                        <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                          Quá hạn
                        </span>
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
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
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
