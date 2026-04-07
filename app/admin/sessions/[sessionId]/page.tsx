import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const OPT_LABEL = ['A', 'B', 'C', 'D']
const OPT_KEY   = ['option_a', 'option_b', 'option_c', 'option_d'] as const

export default async function SessionDetailPage({ params }: { params: { sessionId: string } }) {
  const admin = createAdminClient()

  // Fetch session + user + assignment
  const { data: session } = await admin
    .from('sessions')
    .select('*, users(full_name, email), assignments(title)')
    .eq('id', params.sessionId)
    .single()
  if (!session) notFound()

  // Fetch answers joined with questions
  const { data: answers } = await admin
    .from('answers')
    .select(`
      id, chosen_answer, is_correct, time_spent_s,
      questions(id, content, option_a, option_b, option_c, option_d, correct_answer, domain, skill, difficulty, explanation)
    `)
    .eq('session_id', params.sessionId)
    .order('created_at')

  const correct  = answers?.filter(a => a.is_correct).length  ?? 0
  const wrong    = answers?.filter(a => !a.is_correct && a.chosen_answer).length ?? 0
  const skipped  = answers?.filter(a => !a.chosen_answer).length ?? 0
  const total    = answers?.length ?? 0
  const score    = total > 0 ? Math.round((correct / total) * 100) : 0

  const user       = session.users as any
  const assignment = session.assignments as any

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link
        href={`/admin/assignments/${session.assignment_id}/results`}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit"
      >
        <ArrowLeft size={16} /> Quay lại kết quả bài tập
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{assignment?.title ?? 'Bài tập'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Học viên: <span className="font-medium text-gray-700">{user?.full_name}</span>
          <span className="text-gray-300 mx-2">·</span>
          {user?.email}
          <span className="text-gray-300 mx-2">·</span>
          Nộp lúc {session.finished_at
            ? new Date(session.finished_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Điểm',    value: score + '%', color: score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500', bg: 'bg-white' },
          { label: 'Đúng',    value: correct,  color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Sai',     value: wrong,    color: 'text-red-500',    bg: 'bg-red-50'    },
          { label: 'Bỏ qua', value: skipped,  color: 'text-gray-500',   bg: 'bg-gray-50'   },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border border-gray-200 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {(answers ?? []).map((ans: any, idx: number) => {
          const q             = ans.questions as any
          const chosen        = ans.chosen_answer as string | null
          const correct_ans   = q?.correct_answer as string
          const isCorrect     = ans.is_correct
          const isSkipped     = !chosen

          return (
            <div
              key={ans.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                isSkipped ? 'border-gray-200'
                : isCorrect ? 'border-green-200'
                : 'border-red-200'
              }`}
            >
              {/* Question header */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                isSkipped ? 'bg-gray-50'
                : isCorrect ? 'bg-green-50'
                : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2">
                  {isSkipped
                    ? <MinusCircle size={16} className="text-gray-400" />
                    : isCorrect
                    ? <CheckCircle size={16} className="text-green-600" />
                    : <XCircle    size={16} className="text-red-500" />
                  }
                  <span className="text-sm font-semibold text-gray-700">Câu {idx + 1}</span>
                  {q?.domain && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      q.domain === 'Math'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {q.domain === 'Reading & Writing' ? 'R&W' : q.domain}
                    </span>
                  )}
                  {q?.skill && <span className="text-xs text-gray-400">{q.skill}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {ans.time_spent_s != null && <span>{ans.time_spent_s}s</span>}
                  <span className={`font-semibold ${
                    isSkipped ? 'text-gray-400'
                    : isCorrect ? 'text-green-600'
                    : 'text-red-500'
                  }`}>
                    {isSkipped ? 'Bỏ qua' : isCorrect ? 'Đúng' : 'Sai'}
                  </span>
                </div>
              </div>

              {/* Question content */}
              <div className="px-5 py-4">
                <p className="text-sm text-gray-800 mb-4 leading-relaxed">{q?.content}</p>

                {/* Options */}
                <div className="space-y-2">
                  {OPT_LABEL.map((label, i) => {
                    const optText   = q?.[OPT_KEY[i]] as string
                    const isChosen  = chosen === label
                    const isAnswer  = correct_ans === label

                    let cls = 'border-gray-200 bg-white text-gray-700'
                    if (isAnswer)                    cls = 'border-green-400 bg-green-50 text-green-800 font-semibold'
                    if (isChosen && !isAnswer)       cls = 'border-red-400 bg-red-50 text-red-700'
                    if (isChosen && isAnswer)        cls = 'border-green-500 bg-green-100 text-green-800 font-semibold'

                    return (
                      <div key={label} className={`flex items-start gap-3 px-3 py-2 rounded-xl border text-sm ${cls}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isAnswer
                            ? 'bg-green-500 text-white'
                            : isChosen && !isAnswer
                            ? 'bg-red-400 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {label}
                        </span>
                        <span className="flex-1">{optText}</span>
                        {isChosen && !isAnswer && (
                          <span className="text-xs text-red-400 shrink-0">← Đã chọn</span>
                        )}
                        {isAnswer && isChosen && (
                          <span className="text-xs text-green-600 shrink-0">← Đúng ✓</span>
                        )}
                        {isAnswer && !isChosen && (
                          <span className="text-xs text-green-600 shrink-0">← Đáp án đúng</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {q?.explanation && (
                  <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <span className="font-semibold">Giải thích: </span>{q.explanation}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
