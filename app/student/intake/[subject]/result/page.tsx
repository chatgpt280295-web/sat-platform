import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, ShoppingCart, ArrowRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700 border-green-200',
  2: 'bg-amber-100 text-amber-700 border-amber-200',
  3: 'bg-red-100 text-red-600 border-red-200',
}

const SUBJECT_LABELS: Record<string, string> = {
  math:    'Toán SAT',
  english: 'Tiếng Anh SAT',
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

function scoreToLevel(score: number): 1 | 2 | 3 {
  if (score <= 450) return 1
  if (score <= 650) return 2
  return 3
}

export default async function SubjectIntakeResultPage({
  params,
  searchParams,
}: {
  params: { subject: string }
  searchParams: { score?: string; level?: string }
}) {
  const { subject } = params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const scoreParam = parseInt(searchParams.score ?? '0')
  const level: 1 | 2 | 3 = (parseInt(searchParams.level ?? '0') as any) || scoreToLevel(scoreParam) || 1
  const isMath = subject === 'math'

  // Recommended course
  const { data: course } = await supabase
    .from('courses')
    .select('id, name, subject, level, price, description')
    .eq('is_published', true)
    .eq('subject', subject)
    .eq('level', level)
    .maybeSingle()

  // Check if already enrolled + whether other subject is done
  let enrolled = false
  let otherSubjectDone = false
  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()

  if (profile) {
    if (course) {
      const { data: e } = await supabase
        .from('enrollments').select('id').eq('user_id', profile.id).eq('course_id', course.id).maybeSingle()
      enrolled = !!e
    }
    const otherSubject = subject === 'math' ? 'english' : 'math'
    const { data: otherDiag } = await supabase
      .from('diagnostic_results').select('id').eq('user_id', profile.id).eq('subject', otherSubject).maybeSingle()
    otherSubjectDone = !!otherDiag
  }

  const scoreDisplay = scoreParam > 0 ? scoreParam : null
  const showContinueCTA = isMath && !otherSubjectDone

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Result banner */}
      <div className={`rounded-2xl p-6 mb-6 text-white ${isMath ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'}`}>
        <p className="text-sm opacity-80 mb-1">Kết quả kiểm tra đầu vào</p>
        <h1 className="text-2xl font-bold mb-2">{SUBJECT_LABELS[subject] ?? subject}</h1>
        {scoreDisplay && (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{scoreDisplay}</span>
            <span className="opacity-70 text-sm">/ 800</span>
          </div>
        )}
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${LEVEL_COLORS[level]}`}>
          Trình độ: {LEVEL_LABELS[level]}
        </div>
      </div>

      {/* Recommendation */}
      {course ? (
        <div className="card p-5 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Khóa học phù hợp cho bạn</h2>
          <p className="text-sm text-gray-500 mb-4">Dựa trên kết quả kiểm tra, chúng tôi gợi ý khóa học này:</p>

          <div className={`rounded-xl p-4 border-2 ${isMath ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                <BookOpen size={22} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{course.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isMath ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800'}`}>
                    {SUBJECT_LABELS[subject]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${LEVEL_COLORS[level]}`}>
                    {LEVEL_LABELS[level]}
                  </span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-bold text-gray-900">{formatPrice(course.price)}</div>
              </div>
            </div>
            {course.description && <p className="text-sm text-gray-600 mb-4">{course.description}</p>}

            {enrolled ? (
              <Link href={`/student/courses/${course.id}`}
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors">
                Vào học ngay <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href={`/student/cart?add=${course.id}`}
                className={`flex items-center justify-center gap-2 w-full font-bold py-3 rounded-xl transition-colors text-white ${isMath ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}`}>
                <ShoppingCart size={16} /> Thêm vào giỏ hàng
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-5 text-center">
          <p className="text-gray-500 text-sm">Chưa có khóa học phù hợp cho trình độ này. Vui lòng liên hệ admin.</p>
        </div>
      )}

      {/* Continue to next subject or view combined result */}
      {showContinueCTA ? (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold text-purple-800 mb-1">Tiếp theo: Kiểm tra Tiếng Anh SAT</p>
          <p className="text-xs text-purple-600 mb-3">Hoàn thành để nhận đánh giá tổng thể và Tier của bạn</p>
          <Link href="/student/intake/english?next=/student/intake/result"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">
            Làm bài Tiếng Anh → <ArrowRight size={15} />
          </Link>
        </div>
      ) : !isMath && !otherSubjectDone ? null : (
        <div className="mb-4">
          <Link href="/student/intake/result"
            className="flex items-center justify-center gap-2 w-full btn-primary py-3">
            Xem kết quả tổng hợp <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/student/dashboard" className="btn-secondary flex-1 text-center">
          Về trang chủ
        </Link>
        <Link href="/courses" className="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          Xem tất cả khóa học <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
