import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const OPT_KEY   = ['option_a', 'option_b', 'option_c', 'option_d'] as const
const OPT_LABEL = ['A', 'B', 'C', 'D']

export default async function IntakeResultDetailPage({ params }: { params: { userId: string } }) {
  const admin = createAdminClient()

  const { data: student } = await admin
    .from('users').select('full_name, email, tier').eq('id', params.userId).single()
  if (!student) notFound()

  const { data: diagnostic } = await admin
    .from('diagnostic_results')
    .select('math_score, rw_score, total_score, tier, created_at')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle()

  const { data: intakeAnswers } = await admin
    .from('intake_answers')
    .select(`
      chosen_answer, is_correct,
      questions(id, content, option_a, option_b, option_c, option_d, correct_answer, domain, skill, difficulty, explanation)
    `)
    .eq('user_id', params.userId)
    .order('created_at')

  const correct = intakeAnswers?.filter(a => a.is_correct).length  ?? 0
  const wrong   = intakeAnswers?.filter(a => !a.is_correct && a.chosen_answer).length ?? 0
  const total   = intakeAnswers?.length ?? 0

  const tierLabel: Record<number, string> = { 1: 'Cơ bản', 2: 'Trung bình', 3: 'Khá', 4: 'Giỏi' }
  const tier = diagnostic?.tier ?? student.tier

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`/admin/reports/${params.userId}`}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 w-fit">
        <ArrowLeft size={16} /> Quay lại báo cáo học viên
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả Intake Test</h1>
        <p className="text-sm text-gray-500 mt-1">
          <span className="font-medium text-gray-700">{student.full_name}</span>
          <span className="text-gray-300 mx-2">·</span>{student.email}
          {diagnostic?.created_at && (
            <><span className="text-gray-300 mx-2">·</span>
            {new Date(diagnostic.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
          )}
        </p>
      </div>

      {/* Score summary */}
      {diagnostic ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Math',       value: diagnostic.math_score  ?? '—', color: 'text-blue-700',  bg: 'bg-blue-50'  },
            { label: 'R&W',        value: diagnostic.rw_score    ?? '—', color: 'text-purple-700', bg: 'bg-purple-50' },
            { label: 'Tổng SAT',   value: diagnostic.total_score ?? '—', color: 'text-gray-900',  bg: 'bg-gray-50'  },
            { label: `Tier ${tier ?? '—'}`, value: tier ? tierLabel[tier] ?? '' : '—', color: 'text-green-700', bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-gray-200 rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-700">
          Học viên chưa hoàn thành bài kiểm tra đầu vào.
        </div>
      )}

      {total === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          Chưa có dữ liệu câu trả lời. Học viên cần làm bài kiểm tra đầu vào sau khi hệ thống cập nhật.
        </div>
      ) : (
        <>
          {/* Per-question stat */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle size={14} /> {correct} đúng
            </span>
            <span className="flex items-center gap-1 text-red-500 font-medium">
              <XCircle size={14} /> {wrong} sai
            </span>
            <span className="text-gray-400">/ {total} câu</span>
          </div>

          <div className="space-y-4">
            {(intakeAnswers ?? []).map((ans: any, idx: number) => {
              const q           = ans.questions as any
              const chosen      = ans.chosen_answer as string | null
              const correctAns  = q?.correct_answer as string
              const isCorrect   = ans.is_correct

              return (
                <div key={idx} className={`bg-white rounded-2xl border overflow-hidden ${
                  isCorrect ? 'border-green-200' : 'border-red-200'
                }`}>
                  <div className={`px-5 py-3 flex items-center justify-between ${
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isCorrect
                        ? <CheckCircle size={16} className="text-green-600" />
                        : <XCircle    size={16} className="text-red-500" />
                      }
                      <span className="text-sm font-semibold text-gray-700">Câu {idx + 1}</span>
                      {q?.domain && (
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          q.domain === 'Math' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {q.domain === 'Reading & Writing' ? 'R&W' : q.domain}
                        </span>
                      )}
                      {q?.skill && <span className="text-xs text-gray-400">{q.skill}</span>}
                    </div>
                    <span className={`text-xs font-semibold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {isCorrect ? 'Đúng' : 'Sai'}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-800 mb-4 leading-relaxed">{q?.content}</p>
                    <div className="space-y-2">
                      {OPT_LABEL.map((label, i) => {
                        const optText  = q?.[OPT_KEY[i]] as string
                        const isChosen = chosen === label
                        const isAnswer = correctAns === label

                        let cls = 'border-gray-200 bg-white text-gray-700'
                        if (isAnswer && isChosen)  cls = 'border-green-500 bg-green-100 text-green-800 font-semibold'
                        else if (isAnswer)         cls = 'border-green-400 bg-green-50 text-green-800 font-semibold'
                        else if (isChosen)         cls = 'border-red-400 bg-red-50 text-red-700'

                        return (
                          <div key={label} className={`flex items-start gap-3 px-3 py-2 rounded-xl border text-sm ${cls}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              isAnswer ? 'bg-green-500 text-white'
                              : isChosen ? 'bg-red-400 text-white'
                              : 'bg-gray-100 text-gray-500'
                            }`}>{label}</span>
                            <span className="flex-1">{optText}</span>
                            {isChosen && !isAnswer && <span className="text-xs text-red-400 shrink-0">← Đã chọn</span>}
                            {isAnswer && isChosen  && <span className="text-xs text-green-600 shrink-0">← Đúng ✓</span>}
                            {isAnswer && !isChosen && <span className="text-xs text-green-600 shrink-0">← Đáp án đúng</span>}
                          </div>
                        )
                      })}
                    </div>
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
        </>
      )}
    </div>
  )
}
