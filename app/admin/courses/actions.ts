'use server'

// ── Imports ────────────────────────────────────────────────────────────────────
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Auth guard ────────────────────────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Chưa đăng nhập')
  const { data: profile } = await supabase
    .from('users').select('role').eq('auth_id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Không có quyền truy cập')
}

// ── Course actions ────────────────────────────────────────────────────────────
export async function createCourse(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('courses')
    .insert({
      name:          formData.get('name') as string,
      description:   formData.get('description') as string || null,
      subject:       formData.get('subject') as string,
      level:         parseInt(formData.get('level') as string),
      price:         parseFloat(formData.get('price') as string) || 0,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      is_published:  false,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/courses')
  return data.id
}

export async function updateCourse(courseId: string, formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('courses')
    .update({
      name:          formData.get('name') as string,
      description:   formData.get('description') as string || null,
      subject:       formData.get('subject') as string,
      level:         parseInt(formData.get('level') as string),
      price:         parseFloat(formData.get('price') as string) || 0,
      thumbnail_url: formData.get('thumbnail_url') as string || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/admin/courses')
}

export async function togglePublishCourse(courseId: string, isPublished: boolean) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('courses')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/admin/courses')
  revalidatePath('/')
}

export async function deleteCourse(courseId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/courses')
  revalidatePath('/')
}

// ── Lesson actions ────────────────────────────────────────────────────────────
export async function createLesson(courseId: string, formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  // Lấy position tiếp theo
  const { data: last } = await supabase
    .from('lessons')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const nextPosition = (last?.position ?? -1) + 1

  const { error } = await supabase
    .from('lessons')
    .insert({
      course_id:   courseId,
      title:       formData.get('title') as string,
      description: formData.get('description') as string || null,
      video_url:   formData.get('video_url') as string || null,
      video_type:  formData.get('video_type') as string || 'youtube',
      duration_s:  formData.get('duration_s') ? parseInt(formData.get('duration_s') as string) : null,
      position:    nextPosition,
      is_free:     formData.get('is_free') === 'true',
    })

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function updateLesson(lessonId: string, courseId: string, formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('lessons')
    .update({
      title:       formData.get('title') as string,
      description: formData.get('description') as string || null,
      video_url:   formData.get('video_url') as string || null,
      video_type:  formData.get('video_type') as string || 'youtube',
      duration_s:  formData.get('duration_s') ? parseInt(formData.get('duration_s') as string) : null,
      is_free:     formData.get('is_free') === 'true',
      updated_at:  new Date().toISOString(),
    })
    .eq('id', lessonId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await requireAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', lessonId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function moveLessonPosition(lessonId: string, courseId: string, direction: 'up' | 'down') {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, position')
    .eq('course_id', courseId)
    .order('position')

  if (!lessons) return

  const idx = lessons.findIndex(l => l.id === lessonId)
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1

  if (swapIdx < 0 || swapIdx >= lessons.length) return

  const current = lessons[idx]
  const swap    = lessons[swapIdx]

  await Promise.all([
    supabase.from('lessons').update({ position: swap.position }).eq('id', current.id),
    supabase.from('lessons').update({ position: current.position }).eq('id', swap.id),
  ])

  revalidatePath(`/admin/courses/${courseId}`)
}
