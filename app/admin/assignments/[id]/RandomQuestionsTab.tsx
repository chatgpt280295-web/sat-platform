'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { addRandomQuestionsToAssignment, getAvailableCountMatrix } from '../actions'
import { Shuffle, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────
const DOMAINS = [
  {
    name: 'Math',
    color: 'blue',
    skills: ['Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry'],
  },
  {
    name: 'Reading & Writing',
    short: 'R&W',
    color: 'purple',
    skills: ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions'],
  },
]
const DIFFS = ['Easy', 'Medium', 'Hard'] as const
type Diff  = typeof DIFFS[number]

type SkillRow = { skill: string; domain: string; easy: number; medium: number; hard: number }

const DIFF_COLOR: Record<Diff, string> = {
  Easy:   'text-green-700  bg-green-50  border-green-200',
  Medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  Hard:   'text-red-700    bg-red-50    border-red-200',
}
const DIFF_BADGE: Record<Diff, string> = {
  Easy:   'bg-green-100  text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100    text-red-600',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function initRows(): SkillRow[] {
  return DOMAINS.flatMap(d => d.skills.map(s => ({ skill: s, domain: d.name, easy: 0, medium: 0, hard: 0 })))
}

// ── Component ────────────────────────────────────────────────────────────────
interface Props {
  assignmentId: string
  existingIds: string[]
  onDone: () => void
}

export default function RandomQuestionsTab({ assignmentId, existingIds, onDone }: Props) {
  const [isPending, start] = useTransition()
  const [rows, setRows]    = useState<SkillRow[]>(initRows)
  const [matrix, setMatrix] = useState<Record<string, number>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<any>(null)
  const [loadingMatrix, setLoadingMatrix] = useState(false)

  // Load available counts
  const loadMatrix = useCallback(async () => {
    setLoadingMatrix(true)
    const m = await getAvailableCountMatrix(existingIds)
    setMatrix(m)
    setLoadingMatrix(false)
  }, [existingIds.length]) // eslint-disable-line

  useEffect(() => { loadMatrix() }, [loadMatrix])

  function avail(skill: string, diff: Diff) {
    return matrix[`${skill}__${diff}`] ?? 0
  }

  function setCell(skill: string, diff: Diff, val: number) {
    setRows(prev => prev.map(r =>
      r.skill === skill ? { ...r, [diff.toLowerCase()]: Math.max(0, val) } : r
    ))
  }

  function setRowAll(skill: string, easy: number, medium: number, hard: number) {
    setRows(prev => prev.map(r =>
      r.skill === skill ? { ...r, easy, medium, hard } : r
    ))
  }

  function setDomainAll(domain: string, diff: Diff, val: number) {
    setRows(prev => prev.map(r =>
      r.domain === domain ? { ...r, [diff.toLowerCase()]: Math.max(0, val) } : r
    ))
  }

  function clearAll() { setRows(initRows()) }

  // Derived totals
  const rowTotal  = (r: SkillRow)     => r.easy + r.medium + r.hard
  const colTotal  = (diff: Diff)      => rows.reduce((s, r) => s + (r[diff.toLowerCase() as 'easy' | 'medium' | 'hard'] as number), 0)
  const domTotal  = (domain: string)  => rows.filter(r => r.domain === domain).reduce((s, r) => s + rowTotal(r), 0)
  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0)

  const activeRows = rows.filter(r => rowTotal(r) > 0)

  function handleSubmit() {
    if (activeRows.length === 0) return
    setResult(null)
    start(async () => {
      const res = await addRandomQuestionsToAssignment(assignmentId, activeRows)
      setResult(res)
      if (res.success) setTimeout(() => { loadMatrix(); onDone() }, 1500)
    })
  }

  return (
    <div className="space-y-6">

      {/* Summary bar */}
      {grandTotal > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex-1 flex flex-wrap gap-3 text-sm">
            {DIFFS.map(d => {
              const ct = colTotal(d)
              return ct > 0 ? (
                <span key={d} className={`px-2.5 py-0.5 rounded-lg font-medium text-xs ${DIFF_BADGE[d]}`}>
                  {d}: {ct}
                </span>
              ) : null
            })}
          </div>
          <span className="text-blue-800 font-bold text-sm shrink-0">Tổng: {grandTotal} câu</span>
          <button onClick={clearAll} className="text-xs text-blue-600 hover:text-blue-800 underline shrink-0">
            Xoá tất cả
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Column headers */}
        <div className="grid gap-px bg-gray-200" style={{ gridTemplateColumns: '1fr 100px 100px 100px 80px' }}>
          <div className="bg-gray-50 px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Skill
          </div>
          {DIFFS.map(d => (
            <div key={d} className={`px-3 py-2.5 text-xs font-semibold text-center uppercase tracking-wide ${
              d === 'Easy' ? 'bg-green-50 text-green-700'
              : d === 'Medium' ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
            }`}>
              {d}
              {loadingMatrix
                ? <span className="block text-xs font-normal opacity-50">…</span>
                : null}
            </div>
          ))}
          <div className="bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
            Tổng
          </div>
        </div>

        {/* Domain sections */}
        {DOMAINS.map(domain => {
          const isOpen  = !collapsed[domain.name]
          const domRows = rows.filter(r => r.domain === domain.name)
          const dt      = domTotal(domain.name)

          return (
            <div key={domain.name} className="border-t border-gray-100">
              {/* Domain header */}
              <button
                onClick={() => setCollapsed(c => ({ ...c, [domain.name]: !c[domain.name] }))}
                className={`w-full grid gap-px bg-gray-100 hover:bg-gray-150 transition-colors`}
                style={{ gridTemplateColumns: '1fr 100px 100px 100px 80px' }}
              >
                <div className={`px-4 py-2.5 flex items-center gap-2 font-semibold text-sm ${
                  domain.color === 'blue' ? 'text-blue-700' : 'text-purple-700'
                }`}>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className={`w-2 h-2 rounded-full ${domain.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                  {domain.short ?? domain.name}
                </div>
                {/* Domain-level quick-set inputs */}
                {DIFFS.map(d => {
                  const domDiffTotal = domRows.reduce((s, r) => s + (r[d.toLowerCase() as keyof SkillRow] as number), 0)
                  return (
                    <div key={d} className="bg-white px-2 py-1.5 flex items-center justify-center"
                      onClick={e => e.stopPropagation()}>
                      <input
                        type="number" min={0} max={200}
                        value={domDiffTotal || ''}
                        placeholder="0"
                        title={`Đặt tất cả skill ${domain.name} - ${d}`}
                        onChange={e => {
                          const v = parseInt(e.target.value) || 0
                          const skills = domRows.map(r => r.skill)
                          const each   = Math.floor(v / skills.length)
                          const rem    = v % skills.length
                          setRows(prev => prev.map((r, idx) => {
                            if (r.domain !== domain.name) return r
                            const skillIdx = skills.indexOf(r.skill)
                            return { ...r, [d.toLowerCase()]: each + (skillIdx < rem ? 1 : 0) }
                          }))
                        }}
                        className="w-14 text-center text-sm border border-gray-200 rounded-lg py-1 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                      />
                    </div>
                  )
                })}
                <div className="bg-white px-3 py-1.5 flex items-center justify-center">
                  <span className={`text-sm font-bold ${dt > 0 ? (domain.color === 'blue' ? 'text-blue-700' : 'text-purple-700') : 'text-gray-300'}`}>
                    {dt || '—'}
                  </span>
                </div>
              </button>

              {/* Skill rows */}
              {isOpen && domRows.map(row => {
                const rt = rowTotal(row)
                return (
                  <div
                    key={row.skill}
                    className={`grid gap-px bg-gray-100 border-t border-gray-50 ${rt > 0 ? 'bg-blue-50/20' : ''}`}
                    style={{ gridTemplateColumns: '1fr 100px 100px 100px 80px' }}
                  >
                    {/* Skill name */}
                    <div className="bg-white px-4 py-2 flex items-center gap-2">
                      <span className="text-sm text-gray-700">{row.skill}</span>
                    </div>

                    {/* Difficulty cells */}
                    {DIFFS.map(d => {
                      const av   = avail(row.skill, d)
                      const val  = row[d.toLowerCase() as keyof SkillRow] as number
                      const over = val > av
                      return (
                        <div key={d} className="bg-white px-2 py-1.5 flex flex-col items-center gap-0.5">
                          <input
                            type="number" min={0} max={av || 99}
                            value={val || ''}
                            placeholder="0"
                            onChange={e => setCell(row.skill, d, parseInt(e.target.value) || 0)}
                            className={`w-14 text-center text-sm border rounded-lg py-1 outline-none focus:ring-2 transition-colors ${
                              over
                                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-300'
                                : val > 0
                                ? 'border-blue-300 bg-blue-50 text-blue-800 focus:ring-blue-300'
                                : 'border-gray-200 text-gray-700 focus:ring-blue-300'
                            }`}
                          />
                          {!loadingMatrix && (
                            <span className={`text-xs ${av === 0 ? 'text-red-400' : over ? 'text-red-500' : 'text-gray-400'}`}>
                              /{av}
                            </span>
                          )}
                        </div>
                      )
                    })}

                    {/* Row total */}
                    <div className="bg-white px-3 py-2 flex items-center justify-center">
                      <span className={`text-sm font-semibold ${rt > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                        {rt || '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Footer totals */}
        <div className="grid gap-px bg-gray-200 border-t border-gray-200"
          style={{ gridTemplateColumns: '1fr 100px 100px 100px 80px' }}>
          <div className="bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-600 uppercase">Tổng</div>
          {DIFFS.map(d => {
            const ct = colTotal(d)
            return (
              <div key={d} className={`py-2.5 text-center text-sm font-bold ${
                d === 'Easy' ? 'bg-green-50 text-green-700'
                : d === 'Medium' ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
              }`}>
                {ct || '—'}
              </div>
            )
          })}
          <div className="bg-gray-50 py-2.5 text-center text-sm font-bold text-gray-900">
            {grandTotal || '—'}
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${
          result.success
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {result.success ? (
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle size={15} /> Đã thêm thành công <strong>{result.count}</strong> câu hỏi!
              </div>
              {result.warnings?.length > 0 && (
                <div className="mt-2 text-xs text-amber-700 space-y-0.5">
                  {result.warnings.map((w: string, i: number) => (
                    <p key={i}>⚠ {w}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2"><AlertCircle size={15} /> {result.error}</div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || grandTotal === 0}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
          grandTotal === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
        }`}
      >
        <Shuffle size={16} />
        {isPending
          ? 'Đang chọn câu hỏi ngẫu nhiên…'
          : grandTotal === 0
          ? 'Nhập số lượng câu hỏi ở bảng trên'
          : `Thêm ${grandTotal} câu hỏi ngẫu nhiên vào bài tập`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Số màu xanh = số câu bạn muốn · Số sau / = số câu có sẵn trong ngân hàng · Đỏ = không đủ câu
      </p>
    </div>
  )
}
