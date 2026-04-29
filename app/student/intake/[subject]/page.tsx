import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import SubjectIntakeClient from './SubjectIntakeClient'

const SUBJECT_DOMAIN: Record<string, string> = {
  math:    'Math',
  english: 'Reading & Writing',
}

const SUBJECT_LABELS: Record<string, string> = {
  math:    'Toán SAT',
  english: 'Tiếng Anh SAT',
}

export default async function SubjectIntakePage({
  params,
  searchParams,
}: {
  params: { subject: string }
  searchParams: { next?: string }
}) {
  const { subject } = params
  if (!SUBJECT_DOMAIN[subject]) redirect('/student/dashboard')

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/student/intake/${subject}${searchParams.next ? `?next=${searchParams.next}` : ''}`)

  const { data: profile } = await supabase
    .from('users').select('id').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')

  // Check if already has result for this subject
  const { data: existingResult } = await supabase
    .from('diagnostic_results')
    .select('id')
    .eq('user_id', profile.id)
    .eq('subject', subject)
    .maybeSingle()

  if (existingResult) {
    const dest = searchParams.next ?? `/student/intake/${subject}/result`
    redirect(dest)
  }

  const domain = SUBJECT_DOMAIN[subject]
  const { data: questions } = await supabase
    .from('questions')
    .select('id, content, option_a, option_b, option_c, option_d, domain, skill, difficulty')
    .eq('domain', domain)
    .eq('is_intake', true)
    .limit(50)

  function shuffle(arr: any[]) {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  const shuffled = shuffle(questions ?? []).slice(0, 20)

  if (shuffled.length === 0) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <p className="text-gray-500 text-sm">Bài test đầu vào {SUBJECT_LABELS[subject]} chưa được cấu hình. Vui lòng liên hệ admin.</p>
      </div>
    )
  }

  return (
    <SubjectIntakeClient
      questions={shuffled}
      subject={subject}
      subjectLabel={SUBJECT_LABELS[subject]}
      nextUrl={searchParams.next}
    />
  )
}
