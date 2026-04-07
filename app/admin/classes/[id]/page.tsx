import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClassDetailClient from './ClassDetailClient'

export const dynamic = 'force-dynamic'

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: cls } = await supabase
    .from('classes').select('id, name, description').eq('id', params.id).single()
  if (!cls) notFound()

  // Members in this class
  const { data: members } = await supabase
    .from('class_members')
    .select('user_id, users(id, full_name, email, status)')
    .eq('class_id', params.id)

  // Assignments assigned to this class
  const { data: classAssignments } = await supabase
    .from('class_assignments')
    .select('assignment_id, assignments(id, title, due_date)')
    .eq('class_id', params.id)

  // All students (for adding)
  const { data: allStudents } = await supabase
    .from('users').select('id, full_name, email').eq('role', 'student').eq('status', 'active')
    .order('full_name')

  // All assignments (for adding)
  const { data: allAssignments } = await supabase
    .from('assignments').select('id, title, due_date').order('created_at', { ascending: false })

  const memberIds     = members?.map(m => (m.users as any)?.id).filter(Boolean) ?? []
  const assignmentIds = classAssignments?.map(a => (a.assignments as any)?.id).filter(Boolean) ?? []

  return (
    <ClassDetailClient
      cls={cls}
      members={members?.map(m => m.users as any).filter(Boolean) ?? []}
      classAssignments={classAssignments?.map(a => a.assignments as any).filter(Boolean) ?? []}
      availableStudents={(allStudents ?? []).filter(s => !memberIds.includes(s.id))}
      availableAssignments={(allAssignments ?? []).filter(a => !assignmentIds.includes(a.id))}
    />
  )
}
