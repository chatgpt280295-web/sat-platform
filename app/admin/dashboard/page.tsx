// ── Types & Imports ────────────────────────────────────────────────────────────
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

// ── Data fetching ─────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalStudents },
    { count: totalAssignments },
    { count: totalEnrollments },
    { count: pendingOrders },
    { data: courses },
    { data: recentSessions },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('courses').select('id, name, subject, level').eq('is_published', true).order('name'),
    supabase.from('sessions')
      .select('id, score, finished_at, users(full_name), assignments(title)')
      .not('finished_at', 'is', null)
      .order('finished_at', { ascending: false })
      .limit(10),
  ])

  return (
    <DashboardClient
      stats={{
        totalStudents:    totalStudents    ?? 0,
        totalEnrollments: totalEnrollments ?? 0,
        totalAssignments: totalAssignments ?? 0,
        pendingOrders:    pendingOrders    ?? 0,
      }}
      courses={courses ?? []}
      recentSessions={recentSessions ?? []}
    />
  )
}
