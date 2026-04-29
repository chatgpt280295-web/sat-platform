import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import PostQuizRecommendation from '@/components/quiz/PostQuizRecommendation'

export default async function QuizResultPage({
  params,
  searchParams,
}: {
  params: { courseId: string; quizId: string }
  searchParams: { session?: string; score?: string }
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, passing_score, course_id')
    .eq('id', params.quizId)
    .single()

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, subject, level')
    .eq('id', params.courseId)
    .single()

  // Get session score — prefer query param, fallback to DB
  let score: number = parseInt(searchParams.score ?? '0')
  let correctCount = 0
  let total = 0

  if (searchParams.session) {
    const { data: session } = await supabase
      .from('sessions')
      .select('score, correct_count, total_questions')
      .eq('id', searchParams.session)
      .eq('user_id', profile.id)
      .single()
    if (session) {
      score        = session.score ?? 0
      correctCount = session.correct_count ?? 0
      total        = session.total_questions ?? 0
    }
  }

  const passingScore  = assignment?.passing_score ?? 70
  const passed        = score >= passingScore
  const halfPassing   = passingScore * 0.5

  // Fetch book recommendations for this course/subject
  const { data: books } = await supabase
    .from('book_recommendations')
    .select('id, title, author, description, url, image_url')
    .or(`course_id.eq.${params.courseId},subject.eq.${course?.subject ?? 'math'}`)
    .order('position')
    .limit(3)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Score card */}
      <div className="card text-center py-10 mb-5">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-5 ${
          passed ? 'bg-emerald-100' : score >= halfPassing ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          <span className={`text-3xl font-bold ${
            passed ? 'text-emerald-600' : score >= halfPassing ? 'text-amber-600' : 'text-red-600'
          }`}>{Math.round(score)}%</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {passed ? '🎉 Xuất sắc!' : score >= halfPassing ? '👍 Khá tốt!' : '💪 Cố gắng hơn nhé!'}
        </h2>
        <p className="text-gray-500 text-sm mb-1">
          Đúng <strong className="text-gray-900">{correctCount}</strong> / {total} câu
        </p>
        <p className="text-xs text-gray-400">{assignment?.title} · Điểm đạt: {passingScore}%</p>
      </div>

      {/* Post-quiz recommendation */}
      <PostQuizRecommendation
        score={score}
        passingScore={passingScore}
        courseId={params.courseId}
        subject={course?.subject ?? 'math'}
        books={books ?? []}
        userName={profile.full_name}
        quizId={params.quizId}
      />

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        <Link href={`/student/courses/${params.courseId}/quiz/${params.quizId}`}
          className="btn-secondary flex items-center gap-2">
          <RotateCcw size={16} /> Làm lại
        </Link>
        <Link href={`/student/courses/${params.courseId}`}
          className="flex-1 btn-primary flex items-center justify-center gap-2">
          Tiếp tục khóa học <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
