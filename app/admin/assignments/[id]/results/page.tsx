import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, XCircle, Users, Eye } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AssignmentResultsPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const { data: assignment } = await admin
    .from('assignments')
    .select('id, title, due_date, assignment_questions(count)')
    .eq('id', params.id)
    .single()
  if (!assignment) notFound()

  const qCount = (assignment.assignment_questions as any)?.[0]?.count ?? 0

  // Get all classes that have this assignment
  const { data: classAssignments } = await admin
    .from('class_assignments')
    .select('class_id, classes(id, name)')
    .eq('assignment_id', params.id)

  // Get all submissions for this assignment
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, user_id, score, correct_count, total_questions, finished_at, users(full_name, email)')
    .eq('assignment_id', params.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  // Get all class members to know who hasn't submitted
  const classIds = classAssignments?.map((ca: any) => ca.class_id) ?? []
  const { data: members } = classIds.length > 0
    ? await admin.from('class_members').select('user_id, class_id, users(full_name, email)').in('class_id', classIds)
    : { data: [] }

  // Build submission map: userId → session
  const submissionMap = new Map<string, any>()
  sessions?.forEach((s: any) => submissionMap.set(s.user_id, s))

  // Group members by class
  const classMembersMap = new Map<string, any[]>()
  const classInfoMap    = new Map<string, string>()
  classAssignments?.forEach((ca: any) => {
    classInfoMap.set(ca.class_id, ca.classes?.name ?? ca.class_id)
  })
  members?.forEach((m: any) => {
    const list = classMembersMap.get(m.class_id) ?? []
    list.push(m)
    classMembersMap.set(m.class_id, list)
  })

  // Unassigned submissions (user not in any class)
  const memberUserIds = new Set(members?.map((m: any) => m.user_id) ?? [])
  const unassigned    = sessions?.filter((s: any) => !memberUserIds.has(s.user_id)) ?? []

  const totalSubmitted = sessions?.length ?? 0
  const avgScore = totalSubmitted > 0
    ? Math.round((sessions ?? []).reduce((sum: number, s: any) => sum + (s.score ?? 0), 0) / totalSubmitted)
    : null

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/assignments/${params.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kết quả nộp bài · {qCount} câu hỏi</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Đã nộp</p>
          <p className="text-3xl font-bold text-gray-900">{totalSubmitted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Điểm TB</p>
          <p className="text-3xl font-bold text-gray-900">{avgScore !== null ? avgScore + '%' : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">Tổng học viên (các lớp)</p>
          <p className="text-3xl font-bold text-gray-900">{members?.length ?? 0}</p>
        </div>
      </div>

      {/* By class */}
      {classIds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Bài tập này chưa được giao cho lớp nào.
        </div>
      ) : (
        Array.from(classMembersMap.entries()).map(([classId, classMembers]) => {
          const className = classInfoMap.get(classId) ?? classId
          const submitted = classMembers.filter((m: any) => submissionMap.has(m.user_id))
          const pending   = classMembers.filter((m: any) => !submissionMap.has(m.user_id))

          return (
            <div key={classId} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <h2 className="font-semibold text-gray-900">{className}</h2>
                  <span className="text-xs text-gray-400">({classMembers.length} học viên)</span>
                </div>
                <span className="text-sm text-gray-500">
                  {submitted.length}/{classMembers.length} đã nộp
                </span>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Học viên</th>
                    <th className="px-6 py-3 text-left">Trạng thái</th>
                    <th className="px-6 py-3 text-left">Điểm</th>
                    <th className="px-6 py-3 text-left">Đúng / Tổng</th>
                    <th className="px-6 py-3 text-left">Thời gian nộp</th>
                    <th className="px-6 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classMembers.map((m: any) => {
                    const sess = submissionMap.get(m.user_id)
                    const u    = m.users as any
                    return (
                      <tr key={m.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-gray-900">{u?.full_name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{u?.email}</p>
                        </td>
                        <td className="px-6 py-3">
                          {sess ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                              <CheckCircle size={12} /> Đã nộp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-full font-medium">
                              <Clock size={12} /> Chưa nộp
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          {sess ? (
                            <span className={`text-sm font-bold ${
                              (sess.score ?? 0) >= 70 ? 'text-green-600'
                              : (sess.score ?? 0) >= 50 ? 'text-yellow-600'
                              : 'text-red-500'
                            }`}>{sess.score ?? 0}%</span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {sess ? `${sess.correct_count ?? 0} / ${sess.total_questions ?? qCount}` : '—'}
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {sess?.finished_at
                            ? new Date(sess.finished_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-6 py-3">
                          {sess && (
                            <Link
                              href={`/admin/sessions/${sess.id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <Eye size={13} /> Xem chi tiết
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })
      )}

      {/* Unassigned submissions */}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">Nộp bài ngoài lớp ({unassigned.length})</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Học viên</th>
                <th className="px-6 py-3 text-left">Điểm</th>
                <th className="px-6 py-3 text-left">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unassigned.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{s.users?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{s.users?.email}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-sm font-bold ${(s.score ?? 0) >= 70 ? 'text-green-600' : (s.score ?? 0) >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {s.score ?? 0}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400">
                    {s.finished_at ? new Date(s.finished_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
