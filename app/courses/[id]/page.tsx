// ── Imports ────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  BookOpen, Calculator, Lock, Play, ChevronRight,
  Star, Clock, CheckCircle, ShoppingCart, LogIn, UserPlus
} from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import NavbarUserMenu from '@/components/shared/NavbarUserMenu'

// ── Helpers ───────────────────────────────────────────────────────────────────
const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }
const LEVEL_DESC: Record<number, string>   = {
  1: 'Phù hợp học viên điểm 200–450',
  2: 'Phù hợp học viên điểm 451–650',
  3: 'Phù hợp học viên điểm 651–800',
}

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)}g${m % 60 > 0 ? ` ${m % 60}p` : ''}`
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  // ── Fetch course ────────────────────────────────────────────────────────────
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, description, subject, level, price, thumbnail_url, is_published')
    .eq('id', params.id)
    .single()

  if (!course || !course.is_published) notFound()

  // ── Fetch lessons (public: only title, position, is_free, duration) ─────────
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, video_type, duration_s, position, is_free')
    .eq('course_id', params.id)
    .order('position')

  // ── Check auth + enrollment ─────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()

  let isEnrolled = false
  let userId: string | null = null
  let navProfile: { full_name: string; role: 'admin' | 'student' } | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      userId = profile.id
      navProfile = { full_name: profile.full_name, role: profile.role as 'admin' | 'student' }
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', profile.id)
        .eq('course_id', params.id)
        .single()
      isEnrolled = !!enrollment
    }
  }

  const isMath    = course.subject === 'math'
  const level     = course.level ?? 1
  const lessonList = lessons ?? []
  const freeLessons = lessonList.filter(l => l.is_free)

  return (
    <div className="min-h-screen bg-gray-50">
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
                <Link href={`/login?redirect=/courses/${params.id}`} className="btn-secondary text-sm">
                  <LogIn size={15} /> Đăng nhập
                </Link>
                <Link href={`/register?redirect=/courses/${params.id}`} className="btn-primary text-sm">
                  <UserPlus size={15} /> Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className={`pt-20 pb-10 px-4 ${isMath ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-purple-600 to-purple-800'}`}>
        <div className="max-w-5xl mx-auto">
          <Link href="/courses" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            ← Tất cả khóa học
          </Link>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-4">
                <span className={`badge ${isMath ? 'bg-blue-200 text-blue-900' : 'bg-purple-200 text-purple-900'}`}>
                  {isMath ? '📐 Toán SAT' : '📝 Tiếng Anh SAT'}
                </span>
                <span className="badge bg-white/20 text-white">
                  Level {level} — {LEVEL_LABELS[level]}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">{course.name}</h1>
              {course.description && (
                <p className="text-white/80 text-base leading-relaxed mb-6">{course.description}</p>
              )}
              <p className="text-white/70 text-sm">{LEVEL_DESC[level]}</p>
            </div>

            {/* ── Purchase card ──────────────────────────────────────────────── */}
            <div className="w-full lg:w-80 bg-white rounded-2xl shadow-xl p-6 shrink-0">
              <div className="text-center mb-5">
                <div className={`text-3xl font-extrabold ${isMath ? 'text-blue-700' : 'text-purple-700'} mb-1`}>
                  {formatPrice(course.price)}
                </div>
                {course.price && course.price > 0 && (
                  <p className="text-xs text-gray-400">Trọn đời · Không phí ẩn</p>
                )}
              </div>

              <div className="space-y-3 mb-5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span>{lessonList.length} bài học video</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span>Quiz sau mỗi chương</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span>Hỗ trợ học 1:1 với giáo viên</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-green-500 shrink-0" />
                  <span>Truy cập trọn đời</span>
                </div>
              </div>

              {isEnrolled ? (
                <Link
                  href={`/student/courses/${course.id}`}
                  className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-colors ${isMath ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                >
                  <Play size={16} fill="white" /> Vào học ngay
                </Link>
              ) : user ? (
                // Đã login nhưng chưa enroll → thêm vào giỏ
                <AddToCartButton courseId={course.id} isMath={isMath} price={course.price ?? 0} />
              ) : (
                // Chưa login
                <div className="space-y-3">
                  <Link
                    href={`/login?redirect=/courses/${course.id}`}
                    className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-colors ${isMath ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    <LogIn size={16} /> Đăng nhập để mua
                  </Link>
                  <Link
                    href={`/register?redirect=/courses/${course.id}`}
                    className="flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 text-gray-700 transition-colors"
                  >
                    Tạo tài khoản miễn phí
                  </Link>
                </div>
              )}

              {freeLessons.length > 0 && (
                <p className="text-center text-xs text-gray-400 mt-3">
                  {freeLessons.length} bài học xem miễn phí
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="lg:w-[calc(100%-352px)]">

          {/* Lessons list */}
          <div className="card mb-8">
            <div className="card-header">
              <h2 className="font-bold text-gray-900 text-lg">Nội dung khóa học</h2>
              <span className="text-sm text-gray-500">{lessonList.length} bài học</span>
            </div>

            {lessonList.length === 0 ? (
              <div className="card-body empty-state py-10">
                <Clock size={32} className="text-gray-300 mb-2" />
                <p className="text-gray-500">Bài học đang được cập nhật</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {lessonList.map((lesson, idx) => (
                  <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isMath ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{lesson.title}</span>
                        {lesson.is_free && (
                          <span className="badge-green text-[10px] px-1.5 py-0.5">Xem thử</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.duration_s && (
                        <span className="text-xs text-gray-400">{formatDuration(lesson.duration_s)}</span>
                      )}
                      {isEnrolled || lesson.is_free ? (
                        <Play size={14} className={isMath ? 'text-blue-500' : 'text-purple-500'} />
                      ) : (
                        <Lock size={13} className="text-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Why this course */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Tại sao chọn khóa học này?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '🎯', title: 'Bám sát đề thi thật', desc: 'Câu hỏi được tuyển chọn từ đề thi SAT chính thức' },
                { icon: '🎬', title: 'Video bài giảng HD', desc: 'Giải thích chi tiết từng dạng bài bởi giáo viên kinh nghiệm' },
                { icon: '📊', title: 'Theo dõi tiến độ', desc: 'Hệ thống ghi nhận kết quả và gợi ý ôn tập điểm yếu' },
                { icon: '👨‍🏫', title: 'Hỗ trợ 1:1', desc: 'Đặt lịch học riêng với giáo viên khi cần trợ giúp' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Client component: Add to Cart button ──────────────────────────────────────
// Khai báo riêng vì cần 'use client' cho interaction
function AddToCartButton({ courseId, isMath, price }: { courseId: string; isMath: boolean; price: number }) {
  return (
    <div className="space-y-3">
      <Link
        href={`/student/cart?add=${courseId}`}
        className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-colors ${isMath ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
      >
        <ShoppingCart size={16} /> {price === 0 ? 'Đăng ký miễn phí' : 'Thêm vào giỏ hàng'}
      </Link>
    </div>
  )
}
