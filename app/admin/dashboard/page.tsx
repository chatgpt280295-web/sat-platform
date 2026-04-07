import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalStudents },
    { count: totalQuestions },
    { count: totalAssignments },
    { data: classes },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('classes').select('id, name, class_members(count)').order('created_at', { ascending: false }),
    supabase.from('sessions')
      .select('id, score, finished_at, users(full_name), assignments(title)')
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(10),
  ])

  return (
    <DashboardClient
      stats={{ totalStudents: totalStudents ?? 0, totalQuestions: totalQuestions ?? 0, totalAssignments: totalAssignments ?? 0 }}
      classes={classes ?? []}
      recentSessions={recentSessions ?? []}
    />
  )
}
