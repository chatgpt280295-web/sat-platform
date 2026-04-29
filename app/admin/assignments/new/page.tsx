// ── Types & Imports ────────────────────────────────────────────────────────────
import { createAdminClient } from '@/lib/supabase/admin'
import NewAssignmentForm from './NewAssignmentForm'

// ── Data fetching ─────────────────────────────────────────────────────────────
export default async function NewAssignmentPage() {
  const admin = createAdminClient()
  const { data: courses } = await admin
    .from('courses').select('id, name, subject').order('name')

  return <NewAssignmentForm courses={courses ?? []} />
}
