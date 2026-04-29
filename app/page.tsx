// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { BookOpen, Calculator, Star, Users, TrendingUp, ChevronRight, LogIn, UserPlus } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import NavbarUserMenu from '@/components/shared/NavbarUserMenu'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Course {
  id: string
  name: string
  description: string | null
  subject: 'math' | 'english' | null
  level: 1 | 2 | 3 | null
  price: number | null
  thumbnail_url: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }
const LEVEL_DESC: Record<number, string>   = { 1: 'Điểm 200–450', 2: 'Điểm 451–650', 3: 'Điểm 651–800' }

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function CourseCard({ course }: { course: Course }) {
  const isMath    = course.subject === 'math'
  const level     = course.level ?? 1
  const levelBadgeClass = `level-badge-${level}`
  const cardClass       = isMath ? 'course-card course-card-math' : 'course-card course-card-english'
  const btnClass        = isMath ? 'btn-enroll-math' : 'btn-enroll-english'
  const subjectBadge    = isMath ? 'subject-badge-math' : 'subject-badge-english'
  const subjectLabel    = isMath ? '📐 Toán SAT' : '📝 Tiếng Anh SAT'

  return (
    <div className={cardClass}>
      {/* Thumbnail / Icon */}
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
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={subjectBadge}>{subjectLabel}</span>
          <span className={levelBadgeClass}>Level {level} — {LEVEL_LABELS[level]}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base mb-1 leading-snug">{course.name}</h3>
        <p className="text-xs text-gray-500 mb-1">{LEVEL_DESC[level]}</p>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
        )}

        {/* Price + CTA */}
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
export default async function LandingPage() {
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
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="public-navbar">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SAT Platform</span>
          </Link>
          <div className="flex items-center gap-3">
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

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="hero-gradient pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Star size={14} fill="currentColor" /> Nền tảng luyện thi SAT #1 Việt Nam
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
            Chinh phục SAT<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              theo lộ trình của bạn
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Học từ cơ bản đến nâng cao với giáo viên kinh nghiệm. Kiểm tra đầu vào miễn phí,
            hệ thống gợi ý khóa học phù hợp với trình độ của bạn.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/student/intake/start" className="btn-primary px-8 py-3 text-base">
              Kiểm tra trình độ miễn phí <ChevronRight size={18} />
            </Link>
            <a href="#courses" className="btn-secondary px-8 py-3 text-base">
              Xem khóa học
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              <span>1,200+ học viên</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500" />
              <span>6 khóa học</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" />
              <span>Điểm TB tăng 150+</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diagnostic CTA ────────────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                ✨ Miễn phí · ~15 phút
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
                Bạn đang ở đâu<br />trên hành trình SAT?
              </h2>
              <p className="text-blue-100 text-sm mb-5 leading-relaxed">
                Làm bài kiểm tra 20 câu Toán + 20 câu Tiếng Anh. Nhận đánh giá trình độ và gợi ý khóa học phù hợp ngay sau khi hoàn thành.
              </p>
              <ul className="space-y-1.5 text-sm text-blue-100 mb-6">
                {['Đánh giá cả Toán lẫn Tiếng Anh SAT', 'Kết quả ngay sau khi nộp bài', 'Gợi ý khóa học theo trình độ thực tế'].map(t => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="text-green-300 font-bold">✓</span> {t}
                  </li>
                ))}
              </ul>
              <Link href="/student/intake/start"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm">
                Kiểm tra trình độ ngay <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex-shrink-0 hidden md:flex flex-col gap-3 w-52">
              {([
                ['📐', 'Toán SAT', '20 câu · Algebra, Geometry…'],
                ['📝', 'Tiếng Anh SAT', '20 câu · Reading & Writing…'],
                ['🎯', 'Nhận kết quả', 'Điểm + gợi ý khóa học'],
              ] as const).map(([icon, title, sub]) => (
                <div key={title} className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="font-semibold text-white text-sm">{title}</div>
                    <div className="text-blue-200 text-xs">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Học như thế nào?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '🎯', title: 'Kiểm tra đầu vào', desc: 'Làm bài test ngắn để đánh giá trình độ hiện tại của bạn' },
              { step: '2', icon: '📚', title: 'Gợi ý khóa học', desc: 'Hệ thống tư vấn khóa học phù hợp với điểm số của bạn' },
              { step: '3', icon: '🎬', title: 'Học qua video', desc: 'Xem bài giảng video chất lượng cao theo tiến độ của bạn' },
              { step: '4', icon: '✅', title: 'Kiểm tra & Tiến bộ', desc: 'Làm quiz sau mỗi module, theo dõi điểm số và tiến bộ' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mx-auto mb-3">{item.icon}</div>
                <div className="text-xs font-bold text-gray-400 mb-1">BƯỚC {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses ───────────────────────────────────────────────────────────── */}
      <section id="courses" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Khóa học của chúng tôi</h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              Chọn khóa học phù hợp với trình độ. Hoặc làm bài kiểm tra đầu vào để được tư vấn.
            </p>
          </div>

          {/* Math courses */}
          {mathCourses.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calculator size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Toán SAT</h3>
                  <p className="text-sm text-gray-500">Algebra · Advanced Math · Data Analysis · Geometry</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mathCourses.map(c => <CourseCard key={c.id} course={c as Course} />)}
              </div>
            </div>
          )}

          {/* English courses */}
          {englishCourses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Tiếng Anh SAT</h3>
                  <p className="text-sm text-gray-500">Reading · Writing · Grammar · Vocabulary</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {englishCourses.map(c => <CourseCard key={c.id} course={c as Course} />)}
              </div>
            </div>
          )}

          {/* Empty state: chưa có khóa học */}
          {(courses ?? []).length === 0 && (
            <div className="empty-state py-20">
              <BookOpen size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Chưa có khóa học nào</p>
              <p className="text-gray-400 text-sm mt-1">Admin đang chuẩn bị nội dung, vui lòng quay lại sau.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          {navProfile ? (
            <>
              <h2 className="text-3xl font-extrabold mb-4">Tiếp tục hành trình của bạn</h2>
              <p className="text-blue-100 mb-8 text-base">
                Vào trang cá nhân để xem tiến độ học tập và tiếp tục ôn luyện SAT.
              </p>
              <Link
                href={navProfile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base"
              >
                Vào trang học <ChevronRight size={18} />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold mb-4">Sẵn sàng chinh phục SAT?</h2>
              <p className="text-blue-100 mb-8 text-base">
                Đăng ký miễn phí, làm bài kiểm tra đầu vào và bắt đầu hành trình học tập ngay hôm nay.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-base">
                Đăng ký ngay — Miễn phí <ChevronRight size={18} />
              </Link>
            </>
          )}
        </div>
      </section>

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
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {navProfile ? (
              <Link
                href={navProfile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="hover:text-gray-700 transition-colors"
              >
                Trang học
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-700 transition-colors">Đăng nhập</Link>
                <Link href="/register" className="hover:text-gray-700 transition-colors">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
