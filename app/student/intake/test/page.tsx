import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntakeTestClient from './IntakeTestClient'

export const dynamic = 'force-dynamic'

export default async function IntakeTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id, tier').eq('auth_id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.tier) redirect('/student/intake/result')

  // Lấy 15 câu Math + 15 câu RW ngẫu nhiên
  const { data: mathQs } = await supabase
    .from('questions')
    .select('id, content, option_a, option_b, option_c, option_d, domain, skill, difficulty')
    .eq('domain', 'Math')
    .limit(50)

  const { data: rwQs } = await supabase
    .from('questions')
    .select('id, content, option_a, option_b, option_c, option_d, domain, skill, difficulty')
    .eq('domain', 'Reading & Writing')
    .limit(50)

  // Shuffle và lấy 15 mỗi loại
  function shuffle(arr: any[]) {
    return [...arr].sort(() => Math.random() - 0.5)
  }

  const questions = [
    ...shuffle(mathQs ?? []).slice(0, 15),
    ...shuffle(rwQs  ?? []).slice(0, 15),
  ]

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Chưa có câu hỏi trong ngân hàng. Giáo viên cần thêm câu hỏi trước.</p>
      </div>
    )
  }

  return <IntakeTestClient questions={questions} />
}
