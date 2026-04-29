// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { Plus, BookOpen, Calculator, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { LEVEL_LABELS, SUBJECT_LABELS } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function AdminCoursesPage() {
  const supabase = await createServerClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, name, subject, level, price, is_published, created_at')
    .order('subject')
    .order('level')

  // Lấy thêm lesson count và quiz count cho mỗi course
  const courseIds = (courses ?? []).map(c => c.id)

  const [{ data: lessonCounts }, { data: quizCounts }, { data: enrollCounts }] = await Promise.all([
    supabase.from('lessons').select('course_id').in('course_id', courseIds),
    supabase.from('assignments').select('course_id').in('course_id', courseIds),
    supabase.from('enrollments').select('course_id').in('course_id', courseIds),
  ])

  function countFor(arr: { course_id: string }[] | null, courseId: string) {
    return (arr ?? []).filter(x => x.course_id === courseId).length
  }

  return (
    <div className="p-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Khóa học</h1>
          <p className="page-subtitle">{(courses ?? []).length} khóa học</p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary">
          <Plus size={16} /> Tạo khóa học mới
        </Link>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Khóa học</th>
                <th>Môn</th>
                <th>Cấp độ</th>
                <th>Giá</th>
                <th>Bài học</th>
                <th>Quiz</th>
                <th>Học viên</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(courses ?? []).length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400">
                    Chưa có khóa học nào.{' '}
                    <Link href="/admin/courses/new" className="text-blue-600 hover:underline">Tạo ngay</Link>
                  </td>
                </tr>
              ) : (courses ?? []).map(course => {
                const isMath = course.subject === 'math'
                const level  = course.level ?? 1
                return (
                  <tr key={course.id}>
                    <td>
                      <div className="font-medium text-gray-900">{course.name}</div>
                    </td>
                    <td>
                      <span className={isMath ? 'subject-badge-math' : 'subject-badge-english'}>
                        {isMath ? <Calculator size={11} /> : <BookOpen size={11} />}
                        {course.subject ? SUBJECT_LABELS[course.subject as 'math' | 'english'] : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`level-badge-${level}`}>
                        Level {level} — {LEVEL_LABELS[level as 1|2|3]}
                      </span>
                    </td>
                    <td className="font-medium">{formatPrice(course.price)}</td>
                    <td>{countFor(lessonCounts, course.id)}</td>
                    <td>{countFor(quizCounts, course.id)}</td>
                    <td>{countFor(enrollCounts, course.id)}</td>
                    <td>
                      {course.is_published ? (
                        <span className="badge-green"><Eye size={11} /> Hiển thị</span>
                      ) : (
                        <span className="badge-gray"><EyeOff size={11} /> Ẩn</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/courses/${course.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Quản lý <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
