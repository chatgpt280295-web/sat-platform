import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'

const LEVEL_LABELS: Record<number, string> = { 1: 'Cơ Bản', 2: 'Trung Cấp', 3: 'Nâng Cao' }

export default async function StudentCoursesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, enrolled_at, course:courses(id, name, subject, level, price)')
    .eq('user_id', profile.id)
    .order('enrolled_at', { ascending: false })

  const enrolled = enrollments ?? []
  const courseIds = enrolled.map(e => e.course_id)

  // Lesson progress counts
  let progressMap: Record<string, number> = {}
  let lessonCountMap: Record<string, number> = {}

  if (courseIds.length > 0) {
    const { data: lp } = await supabase
      .from('lesson_progress')
      .select('course_id')
      .eq('user_id', profile.id)
      .in('course_id', courseIds)

    const { data: lc } = await supabase
      .from('lessons')
      .select('course_id')
      .in('course_id', courseIds)

    lp?.forEach(r => { progressMap[r.course_id] = (progressMap[r.course_id] ?? 0) + 1 })
    lc?.forEach(r => { lessonCountMap[r.course_id] = (lessonCountMap[r.course_id] ?? 0) + 1 })
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GraduationCap size={22} /> Khóa học của tôi
          </h1>
          <p className="page-subtitle">{enrolled.length} khóa học</p>
        </div>
        <Link href="/courses" className="btn-primary text-sm">+ Thêm khóa học</Link>
      </div>

      {enrolled.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-4">Bạn chưa đăng ký khóa học nào</p>
          <Link href="/courses" className="btn-primary">Khám phá khóa học</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrolled.map(e => {
            const course = e.course as any
            const done   = progressMap[e.course_id] ?? 0
            const total  = lessonCountMap[e.course_id] ?? 0
            const pct    = total > 0 ? Math.round(done / total * 100) : 0
            const isMath = course?.subject === 'math'

            return (
              <Link key={e.course_id} href={`/student/courses/${e.course_id}`}
                className={`card p-5 hover:shadow-md transition-shadow border-t-4 group ${isMath ? 'border-t-blue-500' : 'border-t-purple-500'}`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isMath ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    <BookOpen size={22} className={isMath ? 'text-blue-600' : 'text-purple-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{course?.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isMath ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {isMath ? 'Toán SAT' : 'Tiếng Anh SAT'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {LEVEL_LABELS[course?.level] ?? `Level ${course?.level}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Tiến độ</span>
                    <span className="font-semibold">{done}/{total} bài học</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className={`h-2 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : isMath ? 'bg-blue-500' : 'bg-purple-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">{pct}% hoàn thành</span>
                    {pct === 100 && <span className="text-xs text-green-600 font-semibold">✓ Hoàn thành</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
