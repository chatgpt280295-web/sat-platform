'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function toggleIntakeQuestion(questionId: string, value: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('questions')
    .update({ is_intake: value })
    .eq('id', questionId)
  if (error) return { error: error.message }
  revalidatePath('/admin/intake')
  return { success: true }
}

export async function setAllIntake(domain: string, value: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('questions')
    .update({ is_intake: value })
    .eq('domain', domain)
  if (error) return { error: error.message }
  revalidatePath('/admin/intake')
  return { success: true }
}
