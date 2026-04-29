'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createBook(formData: FormData) {
  const admin = createAdminClient()
  const { error } = await admin.from('book_recommendations').insert({
    title:       formData.get('title') as string,
    author:      formData.get('author') as string || null,
    description: formData.get('description') as string || null,
    url:         formData.get('url') as string || null,
    image_url:   formData.get('image_url') as string || null,
    subject:     formData.get('subject') as string || null,
    course_id:   formData.get('course_id') as string || null,
    skill:       formData.get('skill') as string || null,
    position:    parseInt(formData.get('position') as string) || 0,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/books')
}

export async function deleteBook(id: string) {
  const admin = createAdminClient()
  const { error } = await admin.from('book_recommendations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/books')
}
