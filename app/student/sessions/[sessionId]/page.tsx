import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const OPT_KEY   = ['option_a', 'option_b', 'option_c', 'option_d'] as const
const OPT_LABEL = ['A', 'B', 'C', 'D']

export default async function StudentSessionReviewPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Lấy session — RLS đảm bảo chỉ xem được của mình
  const { data: session } = await supabase
    .from('sessions')
    .select('*, assignments(title)')
    .eq('id', params.sessionId)
    .eq('user_id', profile.id)
    .single()
  if (!session) notFound()

  // Lấy đáp án kèm câu hỏi
  const { data: answers } = await supabase
    .from('answers')
    .select(`
      id, chosen_answer, is_correct, time_spent_s,
      questions(id, content, option_a, option_b, option_c, option_d, correct_answer, domain, skill, difficulty, explanation)
    `)
    .eq('session_id', params.sessionId)
    .order('created_at')

  const correct  = answers?.filter(a => a.is_correct).length ?? 0
  const wrong    = answers?.filter(a => !a.is_correct && a.chosen_answer).length ?? 0
  const skipped  = answers?.filter(a => !a.chosen_answer).length ?? 0
  const total    = answers?.length ?? 0
  const score    = total > 0 ? Math.round((correct / total) * 100) : 0

  const assignment = session.assignments as any

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/student/results"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 w-fit">
        <ArrowLeft size={16} /> Quay lại kết quả
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{assignment?.title ?? 'Bài tập'}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Nộp lúc {session.finished_at
            ? new Date(session.finished_at).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })
            : '—'}
        </p>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          {
            label: 'Điểm số',
            value: score + '%',
            color: score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500',
            bg: score >= 70 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
          },
          { label: 'Câu đúng',  value: correct,  color: 'text-green-600', bg: 'bg-white border-gray-200' },
          { label: 'Câu sai',   value: wrong,    color: 'text-red-500',   bg: 'bg-white border-gray-200' },
          { label: 'Bỏ qua',   value: skipped,  color: 'text-gray-400',  bg: 'bg-white border-gray-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar tổng */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{correct} câu đúng / {total} câu</span>
          <span>{score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Danh sách câu hỏi */}
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Chi tiết từng câu</h2>

      <div className="space-y-4">
        {(answers ?? []).map((ans: any, idx: number) => {
          const q          = ans.questions as any
          const chosen     = ans.chosen_answer as string | null
          const correctAns = q?.correct_answer as string
          const isCorrect  = ans.is_correct
          const isSkipped  = !chosen

          return (
            <div
              key={ans.id}
              className={`bg-white rounded-2xl border overflow-hidden ${
                isSkipped  ? 'border-gray-200'
                : isCorrect ? 'border-green-200'
                : 'border-red-200'
              }`}
            >
              {/* Header câu hỏi */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                isSkipped  ? 'bg-gray-50'
                : isCorrect ? 'bg-green-50'
                : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 flex-wrap">
                  {isSkipped
                    ? <MinusCircle size={15} className="text-gray-400" />
                    : isCorrect
                    ? <CheckCircle size={15} className="text-green-600" />
                    : <XCircle    size={15} className="text-red-500" />
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
                  {q?.skill && (
                    <span className="text-xs text-gray-400">{q.skill}</span>
                  )}
                </div>
                <span className={`text-xs font-semibold shrink-0 ${
                  isSkipped  ? 'text-gray-400'
                  : isCorrect ? 'text-green-600'
                  : 'text-red-500'
                }`}>
                  {isSkipped ? 'Bỏ qua' : isCorrect ? '✓ Đúng' : '✗ Sai'}
                </span>
              </div>

              {/* Nội dung */}
              <div className="px-5 py-4">
                <p className="text-sm text-gray-800 leading-relaxed mb-4">{q?.content}</p>

                {/* Các đáp án */}
                <div className="space-y-2">
                  {OPT_LABEL.map((label, i) => {
                    const optText  = q?.[OPT_KEY[i]] as string
                    const isChosen = chosen === label
                    const isAnswer = correctAns === label

                    let rowCls = 'border-gray-200 bg-gray-50 text-gray-600'
                    if (isAnswer && isChosen)  rowCls = 'border-green-400 bg-green-100 text-green-800 font-medium'
                    else if (isAnswer)         rowCls = 'border-green-400 bg-green-50 text-green-700 font-medium'
                    else if (isChosen)         rowCls = 'border-red-400 bg-red-50 text-red-700'

                    return (
                      <div key={label} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border text-sm ${rowCls}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isAnswer
                            ? 'bg-green-500 text-white'
                            : isChosen && !isAnswer
                            ? 'bg-red-400 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {label}
                        </span>
                        <span className="flex-1 leading-relaxed">{optText}</span>
                        <span className="text-xs shrink-0 ml-2">
                          {isChosen && !isAnswer && (
                            <span className="text-red-400">← Bạn chọn</span>
                          )}
                          {isAnswer && isChosen && (
                            <span className="text-green-600">← Đúng ✓</span>
                          )}
                          {isAnswer && !isChosen && (
                            <span className="text-green-600">← Đáp án đúng</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Giải thích */}
                {q?.explanation && (
                  <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">💡 Giải thích: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 flex justify-center">
        <Link href="/student/results"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
          Xem tất cả kết quả
        </Link>
      </div>
    </div>
  )
}
