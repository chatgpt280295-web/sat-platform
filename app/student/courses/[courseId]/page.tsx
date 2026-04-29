import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, CheckCircle, ClipboardList, ArrowRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }

function fmtDuration(s: number | null) {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return `${m} phút`
}

export default async function StudentCourseDetailPage({ params }: { params: { courseId: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Enrollment guard
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', profile.id).eq('course_id', params.courseId).maybeSingle()
  if (!enrollment) redirect(`/courses/${params.courseId}`)

  const { data: course } = await supabase
    .from('courses').select('id, name, subject, level, description').eq('id', params.courseId).single()
  if (!course) notFound()

  const [{ data: lessons }, { data: quizzes }, { data: completedLessons }, { data: quizSessions }] = await Promise.all([
    supabase.from('lessons').select('id, title, duration_s, position').eq('course_id', params.courseId).order('position'),
    supabase.from('assignments')
      .select('id, title, passing_score, after_lesson_id')
      .eq('course_id', params.courseId),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', profile.id).eq('course_id', params.courseId),
    supabase.from('sessions').select('assignment_id, score').eq('user_id', profile.id).not('finished_at', 'is', null),
  ])

  const completedSet  = new Set((completedLessons ?? []).map(lp => lp.lesson_id))
  const quizScoreMap  = Object.fromEntries((quizSessions ?? []).map(s => [s.assignment_id, s.score]))
  const quizByLesson  = Object.fromEntries((quizzes ?? []).filter(q => q.after_lesson_id).map(q => [q.after_lesson_id, q]))
  const standaloneQuizzes = (quizzes ?? []).filter(q => !q.after_lesson_id)

  const lessonList = lessons ?? []
  const doneCount  = completedSet.size
  const totalCount = lessonList.length
  const pct        = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0
  const isMath     = course.subject === 'math'

  return (
    <div className="p-6 max-w-3xl">
      {/* Course header */}
      <div className={`rounded-2xl p-6 mb-6 text-white ${isMath ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
            {isMath ? 'Toán SAT' : 'Tiếng Anh SAT'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-medium">
            {LEVEL_LABELS[course.level] ?? `Level ${course.level}`}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{course.name}</h1>
        {course.description && <p className="text-sm opacity-80 line-clamp-2">{course.description}</p>}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1 opacity-80">
            <span>Tiến độ</span>
            <span>{doneCount}/{totalCount} bài học · {pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div className="h-2 bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Unified content list */}
      <div className="card">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Nội dung khóa học</h2>
        </div>

        {lessonList.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">Chưa có bài học nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lessonList.map((lesson, idx) => {
              const done      = completedSet.has(lesson.id)
              const linkedQuiz = quizByLesson[lesson.id]
              const quizScore  = linkedQuiz ? quizScoreMap[linkedQuiz.id] : undefined
              const quizDone   = quizScore !== undefined
              const quizPassed = quizDone && quizScore >= (linkedQuiz?.passing_score ?? 70)

              return (
                <div key={lesson.id}>
                  {/* Lesson row */}
                  <Link href={`/student/courses/${params.courseId}/lessons/${lesson.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? 'bg-green-100 text-green-600' : isMath ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {done ? <CheckCircle size={16} /> : <span>{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{lesson.title}</div>
                      {lesson.duration_s && <div className="text-xs text-gray-400 mt-0.5">{fmtDuration(lesson.duration_s)}</div>}
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </Link>

                  {/* Quiz row (linked to this lesson) */}
                  {linkedQuiz && (
                    <Link href={`/student/courses/${params.courseId}/quiz/${linkedQuiz.id}`}
                      className="flex items-center gap-4 px-4 py-3 bg-purple-50/50 hover:bg-purple-50 transition-colors group ml-8 border-l-2 border-purple-200">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${quizPassed ? 'bg-green-100' : quizDone ? 'bg-amber-100' : 'bg-purple-100'}`}>
                        <ClipboardList size={13} className={quizPassed ? 'text-green-600' : quizDone ? 'text-amber-600' : 'text-purple-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-purple-900 truncate">{linkedQuiz.title}</div>
                        <div className="text-xs text-purple-400">Quiz · Điểm đạt: {linkedQuiz.passing_score ?? 70}%</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {quizDone && (
                          <span className={`text-xs font-bold ${quizPassed ? 'text-green-600' : 'text-amber-500'}`}>
                            {Math.round(quizScore!)}%
                          </span>
                        )}
                        <ArrowRight size={14} className="text-purple-300 group-hover:text-purple-500 transition-colors" />
                      </div>
                    </Link>
                  )}
                </div>
              )
            })}

            {/* Standalone quizzes */}
            {standaloneQuizzes.length > 0 && (
              <div className="px-4 py-3 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bài kiểm tra</p>
                {standaloneQuizzes.map(quiz => {
                  const score  = quizScoreMap[quiz.id]
                  const done   = score !== undefined
                  const passed = done && score >= (quiz.passing_score ?? 70)
                  return (
                    <Link key={quiz.id} href={`/student/courses/${params.courseId}/quiz/${quiz.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-gray-100 rounded-lg px-2 transition-colors group">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-green-100' : done ? 'bg-amber-100' : 'bg-gray-100'}`}>
                        <ClipboardList size={13} className={passed ? 'text-green-600' : done ? 'text-amber-600' : 'text-gray-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate">{quiz.title}</div>
                      </div>
                      {done && <span className={`text-xs font-bold shrink-0 ${passed ? 'text-green-600' : 'text-amber-500'}`}>{Math.round(score)}%</span>}
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
