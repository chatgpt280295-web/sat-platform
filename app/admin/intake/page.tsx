import { createAdminClient } from '@/lib/supabase/admin'
import { CheckSquare, Square, HelpCircle, BookOpen } from 'lucide-react'
import { IntakeToggle, SetAllButton } from './IntakeToggleClient'

export const dynamic = 'force-dynamic'

const DOMAIN_COLOR: Record<string, string> = {
  'Math':              'bg-blue-50 text-blue-700 border-blue-200',
  'Reading & Writing': 'bg-purple-50 text-purple-700 border-purple-200',
}
const DIFF_COLOR: Record<string, string> = {
  easy:   'bg-green-50 text-green-700',
  medium: 'bg-yellow-50 text-yellow-700',
  hard:   'bg-red-50 text-red-700',
}

export default async function AdminIntakePage({
  searchParams,
}: {
  searchParams: { domain?: string; intake?: string }
}) {
  const admin = createAdminClient()

  const { data: allQuestions } = await admin
    .from('questions')
    .select('id, content, domain, skill, difficulty, is_intake')
    .order('domain')
    .order('difficulty')

  const questions = allQuestions ?? []

  // Stats
  const mathTotal   = questions.filter(q => q.domain === 'Math').length
  const rwTotal     = questions.filter(q => q.domain === 'Reading & Writing').length
  const mathIntake  = questions.filter(q => q.domain === 'Math' && q.is_intake).length
  const rwIntake    = questions.filter(q => q.domain === 'Reading & Writing' && q.is_intake).length

  // Filter
  const domainFilter = searchParams.domain ?? ''
  const intakeFilter = searchParams.intake ?? ''

  let filtered = questions
  if (domainFilter) filtered = filtered.filter(q => q.domain === domainFilter)
  if (intakeFilter === '1') filtered = filtered.filter(q => q.is_intake)
  if (intakeFilter === '0') filtered = filtered.filter(q => !q.is_intake)

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình bài kiểm tra đầu vào</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chọn câu hỏi sẽ xuất hiện trong bài kiểm tra đầu vào (Intake Test) của học viên
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Math đã chọn',  value: mathIntake,  total: mathTotal,  color: 'blue'   },
          { label: 'R&W đã chọn',   value: rwIntake,    total: rwTotal,    color: 'purple' },
          { label: 'Tổng đã chọn',  value: mathIntake + rwIntake, total: questions.length, color: 'indigo' },
          { label: 'Tổng câu hỏi',  value: questions.length, total: null, color: 'gray'   },
        ].map(s => (
          <div key={s.label} className={`bg-white border border-gray-200 rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
            {s.total !== null && (
              <p className="text-xs text-gray-400 mt-0.5">/ {s.total} câu</p>
            )}
          </div>
        ))}
      </div>

      {/* Guidance */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
        <strong>Lưu ý:</strong> Hệ thống sẽ lấy ngẫu nhiên <strong>15 câu Math</strong> và <strong>15 câu Reading &amp; Writing</strong> từ danh sách đã chọn bên dưới.
        Nên chọn ít nhất 20+ câu mỗi phần để đảm bảo đa dạng.
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Lọc:</span>

        {/* Domain filter */}
        {[
          { label: 'Tất cả', value: '' },
          { label: 'Math',   value: 'Math' },
          { label: 'R&W',    value: 'Reading & Writing' },
        ].map(opt => (
          <a
            key={opt.value}
            href={`?domain=${encodeURIComponent(opt.value)}&intake=${intakeFilter}`}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              domainFilter === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </a>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Intake filter */}
        {[
          { label: 'Tất cả',     value: '' },
          { label: '✓ Đã chọn', value: '1' },
          { label: '○ Chưa chọn', value: '0' },
        ].map(opt => (
          <a
            key={opt.value}
            href={`?domain=${encodeURIComponent(domainFilter)}&intake=${opt.value}`}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
              intakeFilter === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </a>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Chọn tất cả:</span>
          <SetAllButton domain="Math"              value={true}  label="✓ Math" />
          <SetAllButton domain="Math"              value={false} label="✗ Math" />
          <SetAllButton domain="Reading & Writing" value={true}  label="✓ R&W"  />
          <SetAllButton domain="Reading & Writing" value={false} label="✗ R&W"  />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <HelpCircle size={15} className="text-gray-400" />
            {filtered.length} câu hỏi
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">Không có câu hỏi nào</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((q: any) => (
              <div key={q.id} className={`px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                q.is_intake ? '' : 'opacity-60'
              }`}>
                {/* Toggle */}
                <div className="shrink-0">
                  <IntakeToggle questionId={q.id} checked={q.is_intake ?? false} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{q.content}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{q.skill ?? '—'}</p>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                    DOMAIN_COLOR[q.domain] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {q.domain === 'Reading & Writing' ? 'R&W' : q.domain}
                  </span>
                  {q.difficulty && (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      DIFF_COLOR[q.difficulty] ?? 'bg-gray-50 text-gray-600'
                    }`}>
                      {q.difficulty}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
