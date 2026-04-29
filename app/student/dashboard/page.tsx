import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { BookOpen, TrendingUp, GraduationCap, ShoppingBag, ArrowRight, BarChart2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

export default async function StudentDashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, full_name, email, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Enrolled courses with progress
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at, course:courses(id, name, subject, level)')
    .eq('user_id', profile.id)
    .order('enrolled_at', { ascending: false })
    .limit(6)

  const enrolled = enrollments ?? []

  // Lesson progress counts per course
  const courseIds = enrolled.map(e => e.course_id)
  let progressMap: Record<string, number> = {}
  let lessonCountMap: Record<string, number> = {}

  if (courseIds.length > 0) {
    const { data: lessonProgress } = await supabase
      .from('lesson_progress')
      .select('course_id')
      .eq('user_id', profile.id)
      .in('course_id', courseIds)

    const { data: lessonCounts } = await supabase
      .from('lessons')
      .select('course_id')
      .in('course_id', courseIds)

    lessonProgress?.forEach(lp => {
      progressMap[lp.course_id] = (progressMap[lp.course_id] ?? 0) + 1
    })
    lessonCounts?.forEach(l => {
      lessonCountMap[l.course_id] = (lessonCountMap[l.course_id] ?? 0) + 1
    })
  }

  // Recent quiz results
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, score, finished_at, assignments(title, course_id)')
    .eq('user_id', profile.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(4)

  // Pending orders
  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, total_price, created_at')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(2)

  // Courses to suggest (published, not enrolled)
  const { data: suggestedCourses } = await supabase
    .from('courses')
    .select('id, name, subject, level, price')
    .eq('is_published', true)
    .not('id', 'in', courseIds.length > 0 ? `(${courseIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
    .limit(3)

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div className="p-6 max-w-4xl">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-blue-200 text-sm mb-1">{greet},</p>
        <h1 className="text-2xl font-bold">{profile.full_name} 👋</h1>
        <p className="text-blue-200 text-sm mt-1">{enrolled.length > 0 ? `Đang học ${enrolled.length} khóa học` : 'Hãy bắt đầu hành trình học SAT!'}</p>
      </div>

      {/* Intake test CTA for new students */}
      {!profile.tier && (pendingOrders ?? []).length === 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-800 text-sm">Chào mừng! Hãy làm bài kiểm tra đầu vào</p>
            <p className="text-blue-600 text-xs mt-0.5">~15 phút · Miễn phí · Nhận gợi ý khóa học phù hợp</p>
          </div>
          <Link href="/student/intake"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0">
            Bắt đầu →
          </Link>
        </div>
      )}

      {/* Pending orders CTA */}
      {(pendingOrders ?? []).length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800 text-sm">Bạn có {pendingOrders!.length} đơn hàng chờ thanh toán</p>
            <p className="text-amber-600 text-xs mt-0.5">Upload minh chứng chuyển khoản để được kích hoạt khóa học</p>
          </div>
          <Link href="/student/orders"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Xem ngay →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600" /> Khóa học của tôi
            </h2>
            <Link href="/student/courses" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Xem tất cả →
            </Link>
          </div>

          {enrolled.length === 0 ? (
            <div className="card p-8 text-center">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium mb-3">Chưa đăng ký khóa học nào</p>
              <Link href="/courses" className="btn-primary text-sm">Khám phá khóa học</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolled.map(e => {
                const course = e.course as any
                const done  = progressMap[e.course_id] ?? 0
                const total = lessonCountMap[e.course_id] ?? 0
                const pct   = total > 0 ? Math.round(done / total * 100) : 0
                const isMath = course?.subject === 'math'
                return (
                  <Link key={e.course_id} href={`/student/courses/${e.course_id}`}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      <BookOpen size={20} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{course?.name}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                          <div className={`h-1.5 rounded-full ${isMath ? 'bg-blue-500' : 'bg-purple-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{done}/{total} bài</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}

          {/* Recent results */}
          {(sessions ?? []).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart2 size={18} className="text-green-600" /> Kết quả gần đây
                </h2>
                <Link href="/student/results" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Xem tất cả →</Link>
              </div>
              <div className="card divide-y divide-gray-50">
                {(sessions as any[]).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3">
                    <div className="text-sm text-gray-700 truncate max-w-[220px]">{s.assignments?.title ?? '—'}</div>
                    <span className={`text-sm font-bold ${(s.score ?? 0) >= 70 ? 'text-green-600' : (s.score ?? 0) >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {Math.round(s.score ?? 0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: suggestions */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" /> Gợi ý cho bạn
          </h2>
          {(suggestedCourses ?? []).length === 0 ? (
            <div className="card p-6 text-center text-gray-400 text-sm">Bạn đã đăng ký tất cả khóa học 🎉</div>
          ) : (
            <div className="space-y-3">
              {(suggestedCourses ?? []).map(c => {
                const isMath = c.subject === 'math'
                return (
                  <Link key={c.id} href={`/courses/${c.id}`}
                    className="card p-4 hover:shadow-md transition-shadow block group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        <BookOpen size={14} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
                      </div>
                      <div className="text-sm font-semibold text-gray-900 flex-1 truncate">{c.name}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700">{formatPrice(c.price)}</span>
                      <span className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">Xem →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <Link href="/courses"
            className="flex items-center justify-center gap-2 w-full border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-xl transition-colors text-sm">
            <ShoppingBag size={16} /> Xem tất cả khóa học
          </Link>
        </div>
      </div>
    </div>
  )
}
