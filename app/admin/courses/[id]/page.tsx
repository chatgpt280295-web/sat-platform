// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft, Plus, Play, BookOpen, Calculator,
  Eye, EyeOff, Users, FileText, ClipboardList,
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { LEVEL_LABELS, SUBJECT_LABELS } from '@/types'
import PublishToggle from './PublishToggle'
import LessonActions from './LessonActions'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function formatDuration(s: number | null) {
  if (!s) return null
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}p` : `${Math.floor(m / 60)}g${m % 60 > 0 ? `${m % 60}p` : ''}`
}

const VIDEO_TYPE_LABEL: Record<string, string> = {
  youtube: '▶ YouTube',
  upload:  '📁 Upload',
  url:     '🔗 URL',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CourseDetailAdminPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const [
    { data: course },
    { data: lessons },
    { data: quizzes },
    { data: enrollments },
  ] = await Promise.all([
    supabase.from('courses').select('*').eq('id', params.id).single(),
    supabase.from('lessons').select('*').eq('course_id', params.id).order('position'),
    supabase.from('assignments')
      .select('id, title, passing_score, after_lesson_id')
      .eq('course_id', params.id),
    supabase.from('enrollments').select('id').eq('course_id', params.id),
  ])

  if (!course) notFound()

  const isMath = course.subject === 'math'
  const level  = course.level ?? 1

  // Build interleaved list: each lesson, then its attached quiz (if any)
  const quizByLesson = Object.fromEntries(
    (quizzes ?? []).filter(q => q.after_lesson_id).map(q => [q.after_lesson_id, q])
  )
  // Quizzes not linked to any lesson (standalone)
  const standaloneQuizzes = (quizzes ?? []).filter(q => !q.after_lesson_id)

  return (
    <div className="p-6 max-w-4xl">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link href="/admin/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={15} /> Tất cả khóa học
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={isMath ? 'subject-badge-math' : 'subject-badge-english'}>
                {isMath ? <Calculator size={11} /> : <BookOpen size={11} />}
                {course.subject ? SUBJECT_LABELS[course.subject as 'math' | 'english'] : ''}
              </span>
              <span className={`level-badge-${level}`}>
                Level {level} — {LEVEL_LABELS[level as 1|2|3]}
              </span>
              {course.is_published
                ? <span className="badge-green"><Eye size={11} /> Hiển thị</span>
                : <span className="badge-gray"><EyeOff size={11} /> Ẩn</span>
              }
            </div>
            <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatPrice(course.price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <PublishToggle courseId={course.id} isPublished={course.is_published ?? false} />
            <Link href={`/admin/courses/${params.id}/edit`} className="btn-secondary text-sm">
              Chỉnh sửa
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50"><Play size={20} className="text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(lessons ?? []).length}</div>
            <div className="text-sm text-gray-500">Bài học</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-50"><FileText size={20} className="text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(quizzes ?? []).length}</div>
            <div className="text-sm text-gray-500">Quiz</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-50"><Users size={20} className="text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{(enrollments ?? []).length}</div>
            <div className="text-sm text-gray-500">Học viên</div>
          </div>
        </div>
      </div>

      {/* ── Unified content list ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-bold text-gray-900">Nội dung khóa học</h2>
          <Link href={`/admin/courses/${params.id}/lessons/new`} className="btn-primary text-xs px-3 py-1.5">
            <Plus size={13} /> Thêm bài học
          </Link>
        </div>

        {(lessons ?? []).length === 0 ? (
          <div className="card-body empty-state py-12">
            <Play size={32} className="text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm mb-3">Chưa có bài học nào</p>
            <Link href={`/admin/courses/${params.id}/lessons/new`} className="btn-primary text-xs">
              <Plus size={13} /> Thêm bài học đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(lessons ?? []).map((lesson, idx) => {
              const linkedQuiz = quizByLesson[lesson.id]
              return (
                <div key={lesson.id}>
                  {/* Lesson row */}
                  <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 group">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{lesson.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {VIDEO_TYPE_LABEL[lesson.video_type] ?? lesson.video_type}
                        </span>
                        {lesson.duration_s && (
                          <span className="text-[10px] text-gray-400">{formatDuration(lesson.duration_s)}</span>
                        )}
                        {lesson.is_free && <span className="badge-green text-[10px] px-1.5 py-0.5">Xem thử</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!linkedQuiz && (
                        <Link
                          href={`/admin/courses/${params.id}/quizzes/new?after=${lesson.id}&afterTitle=${encodeURIComponent(lesson.title)}`}
                          className="text-[11px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 border border-purple-200 bg-purple-50 px-2 py-1 rounded-lg"
                        >
                          <ClipboardList size={11} /> + Quiz
                        </Link>
                      )}
                    </div>
                    <LessonActions
                      lessonId={lesson.id}
                      courseId={params.id}
                      isFirst={idx === 0}
                      isLast={idx === (lessons ?? []).length - 1}
                    />
                  </div>

                  {/* Quiz row (if linked to this lesson) */}
                  {linkedQuiz && (
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-purple-50/40 border-l-2 border-purple-200 ml-8 mr-0">
                      <ClipboardList size={14} className="text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-purple-800 truncate">{linkedQuiz.title}</div>
                        <div className="text-xs text-purple-400">Quiz · Điểm đạt: {linkedQuiz.passing_score ?? 70}%</div>
                      </div>
                      <Link href={`/admin/assignments/${linkedQuiz.id}`}
                        className="text-xs text-purple-600 hover:underline shrink-0">
                        Quản lý
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Standalone quizzes (not linked to any lesson) */}
            {standaloneQuizzes.length > 0 && (
              <div className="px-5 py-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quiz độc lập</p>
                <div className="space-y-1">
                  {standaloneQuizzes.map(quiz => (
                    <div key={quiz.id} className="flex items-center gap-3 py-2">
                      <ClipboardList size={14} className="text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 truncate">{quiz.title}</div>
                        <div className="text-xs text-gray-400">Điểm đạt: {quiz.passing_score ?? 70}%</div>
                      </div>
                      <Link href={`/admin/assignments/${quiz.id}`}
                        className="text-xs text-blue-600 hover:underline shrink-0">
                        Quản lý
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
          <Link href={`/admin/courses/${params.id}/quizzes/new`}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Plus size={12} /> Thêm quiz độc lập (không gắn với bài học)
          </Link>
        </div>
      </div>
    </div>
  )
}
