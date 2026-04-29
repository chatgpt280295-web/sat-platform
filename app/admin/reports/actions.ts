'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getAllStudentsWithStats() {
  const admin = createAdminClient()
  const { data: students } = await admin
    .from('users')
    .select('id, full_name, email, tier, status, created_at')
    .eq('role', 'student')
    .order('full_name')

  if (!students) return []

  const results = await Promise.all(students.map(async (s) => {
    const [{ data: sessions }, { count: errCnt }, { data: enrollments }, { data: lessonProgress }] = await Promise.all([
      admin.from('sessions')
        .select('score, finished_at')
        .eq('user_id', s.id)
        .not('finished_at', 'is', null)
        .order('finished_at', { ascending: false })
        .limit(10),
      admin.from('error_logs').select('*', { count: 'exact', head: true }).eq('user_id', s.id),
      admin.from('enrollments').select('course_id').eq('user_id', s.id),
      admin.from('lesson_progress').select('course_id').eq('user_id', s.id),
    ])

    const avgScore = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum, x) => sum + (x.score ?? 0), 0) / sessions.length)
      : null

    return {
      ...s,
      latestScore: sessions?.[0]?.score ?? null,
      avgScore,
      enrolledCourses: enrollments?.length ?? 0,
      completedLessons: lessonProgress?.length ?? 0,
      errorCount: errCnt ?? 0,
      sessionCount: sessions?.length ?? 0,
    }
  }))

  return results
}

export async function getStudentReportData(userId: string) {
  const admin = createAdminClient()
  const [
    { data: student },
    { data: sessions },
    { data: diagnostics },
    { data: errors },
    { data: report },
  ] = await Promise.all([
    admin.from('users').select('id, full_name, email, tier, status').eq('id', userId).single(),
    admin.from('sessions')
      .select('id, score, finished_at, correct_count, total_questions, assignments(title)')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: true }),
    admin.from('diagnostic_results')
      .select('math_score, rw_score, total_score, subject, tier, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin.from('error_logs')
      .select('domain, skill, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    admin.from('progress_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!student) return null

  // Lấy diagnostic mới nhất và tách theo subject nếu có
  const diagnostic = (diagnostics ?? [])[0] ?? null
  const mathDiag   = (diagnostics ?? []).find((d: any) => d.subject === 'math') ?? diagnostic
  const engDiag    = (diagnostics ?? []).find((d: any) => d.subject === 'english') ?? null

  const skillMap: Record<string, { count: number; domain: string }> = {}
  errors?.forEach((e: any) => {
    const key = e.skill || e.domain || 'Khác'
    if (!skillMap[key]) skillMap[key] = { count: 0, domain: e.domain ?? '' }
    skillMap[key].count++
  })

  const topErrors = Object.entries(skillMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([skill, d]) => ({ skill, count: d.count, domain: d.domain }))

  return {
    student,
    sessions: sessions ?? [],
    diagnostic,
    mathDiag,
    engDiag,
    topErrors,
    mathErrors: errors?.filter((e: any) => e.domain === 'Math').length ?? 0,
    rwErrors: errors?.filter((e: any) => e.domain === 'Reading & Writing').length ?? 0,
    totalErrors: errors?.length ?? 0,
    report,
  }
}

export async function saveProgressReport(
  userId: string,
  teacherComment: string,
  recommendations: string,
) {
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('progress_reports')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await admin.from('progress_reports')
      .update({ teacher_comment: teacherComment, recommendations })
      .eq('id', existing.id)
  } else {
    await admin.from('progress_reports').insert({
      user_id: userId,
      teacher_comment: teacherComment,
      recommendations,
    })
  }

  revalidatePath(`/admin/reports/${userId}`)
  return { success: true }
}
