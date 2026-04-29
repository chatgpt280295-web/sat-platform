// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { BookOpen, Calculator, ChevronRight, LogIn, UserPlus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import NavbarUserMenu from '@/components/shared/NavbarUserMenu'

export const dynamic = 'force-dynamic'

// ── Types & helpers ────────────────────────────────────────────────────────────
interface Course {
  id: string
  name: string
  description: string | null
  subject: 'math' | 'english' | null
  level: 1 | 2 | 3 | null
  price: number | null
  thumbnail_url: string | null
}

const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }
const LEVEL_DESC: Record<number, string>   = { 1: 'Điểm 200–450', 2: 'Điểm 451–650', 3: 'Điểm 651–800' }

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function CourseCard({ course }: { course: Course }) {
  const isMath         = course.subject === 'math'
  const level          = course.level ?? 1
  const cardClass      = isMath ? 'course-card course-card-math' : 'course-card course-card-english'
  const btnClass       = isMath ? 'btn-enroll-math' : 'btn-enroll-english'
  const subjectBadge   = isMath ? 'subject-badge-math' : 'subject-badge-english'
  const subjectLabel   = isMath ? '📐 Toán SAT' : '📝 Tiếng Anh SAT'
  const levelBadgeClass = `level-badge-${level}`

  return (
    <div className={cardClass}>
      <div className={`h-36 flex items-center justify-center ${isMath ? 'bg-blue-50' : 'bg-purple-50'}`}>
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.name} className="h-full w-full object-cover" />
        ) : (
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
            {isMath ? <Calculator size={32} className="text-blue-600" /> : <BookOpen size={32} className="text-purple-600" />}
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={subjectBadge}>{subjectLabel}</span>
          <span className={levelBadgeClass}>Level {level} — {LEVEL_LABELS[level]}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{course.name}</h3>
        <p className="text-xs text-gray-500 mb-1">{LEVEL_DESC[level]}</p>
        {course.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className={`font-bold text-lg ${isMath ? 'text-blue-700' : 'text-purple-700'}`}>
            {formatPrice(course.price)}
          </span>
        </div>
        <Link href={`/courses/${course.id}`} className={btnClass}>
          Xem khóa học <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CoursesPage() {
  const supabase = await createServerClient()

  const [{ data: courses }, { data: { user } }] = await Promise.all([
    supabase.from('courses')
      .select('id, name, description, subject, level, price, thumbnail_url')
      .eq('is_published', true)
      .order('subject')
      .order('level'),
    supabase.auth.getUser(),
  ])

  type NavProfile = { full_name: string; role: 'admin' | 'student' }
  let navProfile: NavProfile | null = null
  if (user) {
    const { data } = await supabase
      .from('users').select('full_name, role').eq('auth_id', user.id).single()
    if (data) navProfile = data as NavProfile
  }

  const mathCourses    = (courses ?? []).filter(c => c.subject === 'math')
  const englishCourses = (courses ?? []).filter(c => c.subject === 'english')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navbar ────────────────────────────────────────────────────────────── */}
      <nav className="public-navbar">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SAT Platform</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/courses" className="text-sm font-medium text-blue-600">Khóa học</Link>
            {navProfile ? (
              <NavbarUserMenu fullName={navProfile.full_name} role={navProfile.role} />
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">
                  <LogIn size={15} /> Đăng nhập
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  <UserPlus size={15} /> Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            ← Trang chủ
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Tất cả khóa học</h1>
          <p className="text-gray-500 text-base">
            Chọn khóa học phù hợp trình độ — hoặc{' '}
            <Link href="/student/intake/start" className="text-blue-600 hover:underline font-medium">
              làm bài kiểm tra đầu vào miễn phí
            </Link>{' '}
            để được tư vấn.
          </p>
        </div>
      </div>

      {/* ── Course catalog ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Math */}
        {mathCourses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calculator size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Toán SAT</h2>
                <p className="text-sm text-gray-500">Algebra · Advanced Math · Data Analysis · Geometry</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mathCourses.map(c => <CourseCard key={c.id} course={c as Course} />)}
            </div>
          </div>
        )}

        {/* English */}
        {englishCourses.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tiếng Anh SAT</h2>
                <p className="text-sm text-gray-500">Reading · Writing · Grammar · Vocabulary</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {englishCourses.map(c => <CourseCard key={c.id} course={c as Course} />)}
            </div>
          </div>
        )}

        {/* Empty */}
        {(courses ?? []).length === 0 && (
          <div className="empty-state py-20">
            <BookOpen size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">Chưa có khóa học nào</p>
            <p className="text-gray-400 text-sm mt-1">Admin đang chuẩn bị nội dung, vui lòng quay lại sau.</p>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-700">SAT Platform</span>
          </div>
          <p className="text-sm text-gray-400">© 2026 SAT Platform. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    </div>
  )
}
