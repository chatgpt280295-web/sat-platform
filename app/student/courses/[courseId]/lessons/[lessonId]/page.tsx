import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import MarkCompleteBtn from './MarkCompleteBtn'

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]+)/)
  return m?.[1] ?? null
}

export default async function LessonPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', profile.id).eq('course_id', params.courseId).maybeSingle()
  if (!enrollment) redirect(`/courses/${params.courseId}`)

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, description, video_url, video_type, position, course_id')
    .eq('id', params.lessonId)
    .eq('course_id', params.courseId)
    .single()

  if (!lesson) notFound()

  // Prev / next lessons
  const { data: siblings } = await supabase
    .from('lessons').select('id, position').eq('course_id', params.courseId).order('position')

  const idx  = (siblings ?? []).findIndex(l => l.id === params.lessonId)
  const prev = siblings?.[idx - 1] ?? null
  const next = siblings?.[idx + 1] ?? null

  // Quiz linked to this lesson
  const { data: linkedQuiz } = await supabase
    .from('assignments')
    .select('id, title, passing_score')
    .eq('after_lesson_id', params.lessonId)
    .maybeSingle()

  // Completion + quiz status
  const [{ data: progress }, quizSessionResult] = await Promise.all([
    supabase.from('lesson_progress').select('id').eq('user_id', profile.id).eq('lesson_id', params.lessonId).maybeSingle(),
    linkedQuiz
      ? supabase.from('sessions').select('id, score').eq('user_id', profile.id).eq('assignment_id', linkedQuiz.id).not('finished_at', 'is', null).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isCompleted = !!progress
  const quizDone    = !!(quizSessionResult as any)?.data
  const quizScore   = (quizSessionResult as any)?.data?.score ?? null

  // Build video src
  let videoSrc: string | null = null
  if (lesson.video_url) {
    if (lesson.video_type === 'upload') {
      const admin = createAdminClient()
      const { data } = await admin.storage.from('lesson-videos').createSignedUrl(lesson.video_url, 3600)
      videoSrc = data?.signedUrl ?? null
    } else {
      videoSrc = lesson.video_url
    }
  }

  const ytId = lesson.video_type === 'youtube' && lesson.video_url ? getYoutubeId(lesson.video_url) : null

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href={`/student/courses/${params.courseId}`}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{lesson.title}</h1>
        {isCompleted && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle size={14} /> Đã hoàn thành
          </span>
        )}
      </div>

      {/* Video player */}
      <div className="card overflow-hidden mb-5">
        {ytId ? (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe src={`https://www.youtube.com/embed/${ytId}`}
              className="absolute inset-0 w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        ) : videoSrc ? (
          <video controls className="w-full max-h-[480px] bg-black" src={videoSrc} />
        ) : (
          <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-400 text-sm">
            Chưa có video
          </div>
        )}
      </div>

      {/* Description */}
      {lesson.description && (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-2">Mô tả bài học</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{lesson.description}</p>
        </div>
      )}

      {/* Quiz prompt (shown after lesson is completed) */}
      {linkedQuiz && isCompleted && (
        <div className={`card p-4 mb-5 border-2 flex items-center gap-4 ${quizDone ? 'border-green-200 bg-green-50' : 'border-purple-200 bg-purple-50'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${quizDone ? 'bg-green-100' : 'bg-purple-100'}`}>
            <ClipboardList size={20} className={quizDone ? 'text-green-600' : 'text-purple-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900">{linkedQuiz.title}</div>
            {quizDone
              ? <div className="text-xs text-green-600 mt-0.5">Đã hoàn thành · {Math.round(quizScore)}%</div>
              : <div className="text-xs text-purple-600 mt-0.5">Kiểm tra kiến thức vừa học · Điểm đạt: {linkedQuiz.passing_score ?? 70}%</div>
            }
          </div>
          <Link href={`/student/courses/${params.courseId}/quiz/${linkedQuiz.id}`}
            className={`shrink-0 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${quizDone ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
            {quizDone ? 'Xem lại' : 'Làm quiz →'}
          </Link>
        </div>
      )}

      {/* Quiz prompt (not yet completed lesson) */}
      {linkedQuiz && !isCompleted && (
        <div className="card p-4 mb-5 border border-dashed border-purple-200 bg-purple-50/30 flex items-center gap-3 opacity-60">
          <ClipboardList size={16} className="text-purple-400 shrink-0" />
          <p className="text-sm text-purple-600">
            Quiz <strong>{linkedQuiz.title}</strong> sẽ mở sau khi bạn hoàn thành bài học này
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {prev ? (
          <Link href={`/student/courses/${params.courseId}/lessons/${prev.id}`}
            className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Bài trước
          </Link>
        ) : <div />}

        <div className="flex-1" />

        {!isCompleted && (
          <MarkCompleteBtn lessonId={params.lessonId} courseId={params.courseId} />
        )}

        {/* If has linked quiz and not done → go to quiz instead of next lesson */}
        {isCompleted && linkedQuiz && !quizDone ? (
          <Link href={`/student/courses/${params.courseId}/quiz/${linkedQuiz.id}`}
            className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <ClipboardList size={16} /> Làm quiz
          </Link>
        ) : next ? (
          <Link href={`/student/courses/${params.courseId}/lessons/${next.id}`}
            className="btn-primary flex items-center gap-2">
            Bài tiếp <ArrowRight size={16} />
          </Link>
        ) : (
          <Link href={`/student/courses/${params.courseId}`}
            className="btn-primary flex items-center gap-2">
            Về khóa học <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}
