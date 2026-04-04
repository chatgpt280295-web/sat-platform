'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createQuestion(formData: FormData) {
  const admin = createAdminClient()
  const payload = {
    domain:         formData.get('domain')         as string,
    skill:          formData.get('skill')          as string,
    difficulty:     formData.get('difficulty')     as string,
    source:         formData.get('source')         as string || null,
    content:        formData.get('content')        as string,
    option_a:       formData.get('option_a')       as string,
    option_b:       formData.get('option_b')       as string,
    option_c:       formData.get('option_c')       as string,
    option_d:       formData.get('option_d')       as string,
    correct_answer: formData.get('correct_answer') as string,
    explanation:    formData.get('explanation')    as string || null,
  }
  const { error } = await admin.from('questions').insert(payload)
  if (error) return { error: error.message }
  revalidatePath('/admin/questions')
  return { success: true }
}

export async function deleteQuestion(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('questions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/questions')
  return { success: true }
}

export async function importQuestionsFromCSV(rows: Array<Record<string, string>>) {
  const admin    = createAdminClient()
  const required = ['domain','skill','difficulty','content','option_a','option_b','option_c','option_d','correct_answer']
  const valid    = rows.filter(r => required.every(k => r[k]))
  if (!valid.length) return { error: 'Không có dòng hợp lệ', count: 0 }
  const { error } = await admin.from('questions').insert(valid)
  if (error) return { error: error.message, count: 0 }
  revalidatePath('/admin/questions')
  return { success: true, count: valid.length }
}
