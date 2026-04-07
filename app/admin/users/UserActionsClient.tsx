'use client'
import { useState } from 'react'
import { KeyRound, Power, Trash2 } from 'lucide-react'
import { toggleUserStatus, setStudentTier } from './actions'
import ResetPasswordModal from './ResetPasswordModal'

interface Props {
  userId: string
  studentName: string
  status: string
  tier: number | null
  mode: 'tier' | 'actions'
}

const TIER_OPTIONS = [
  { value: '', label: 'Chưa xếp', cls: 'text-gray-400' },
  { value: '1', label: 'Tier 1 — Cơ bản',    cls: 'text-red-600' },
  { value: '2', label: 'Tier 2 — Trung bình', cls: 'text-yellow-600' },
  { value: '3', label: 'Tier 3 — Khá',        cls: 'text-blue-600' },
  { value: '4', label: 'Tier 4 — Giỏi',       cls: 'text-green-600' },
]

const TIER_BADGE: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-green-100 text-green-700',
}

export default function UserActionsClient({ userId, studentName, status, tier, mode }: Props) {
  const [showReset, setShowReset] = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [curStatus, setCurStatus] = useState(status)
  const [curTier, setCurTier]     = useState<number | null>(tier)
  const [savingTier, setSavingTier] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const res = await toggleUserStatus(userId, curStatus)
    if (!res.error) setCurStatus(curStatus === 'active' ? 'inactive' : 'active')
    setToggling(false)
  }

  async function handleTierChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value === '' ? null : parseInt(e.target.value)
    setSavingTier(true)
    const res = await setStudentTier(userId, val)
    if (!res.error) setCurTier(val)
    setSavingTier(false)
  }

  // Tier column
  if (mode === 'tier') {
    return (
      <div className="flex items-center gap-2">
        {curTier && (
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${TIER_BADGE[curTier] ?? 'bg-gray-100 text-gray-600'}`}>
            T{curTier}
          </span>
        )}
        <select
          value={curTier?.toString() ?? ''}
          onChange={handleTierChange}
          disabled={savingTier}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
        >
          {TIER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  // Actions column
  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowReset(true)}
          title="Đổi mật khẩu"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <KeyRound size={13} /> Đổi MK
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={curStatus === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-60 ${
            curStatus === 'active'
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-green-600 bg-green-50 hover:bg-green-100'
          }`}>
          <Power size={13} />
          {toggling ? '...' : curStatus === 'active' ? 'Khóa' : 'Mở'}
        </button>
      </div>
      {showReset && (
        <ResetPasswordModal
          userId={userId}
          studentName={studentName}
          onClose={() => setShowReset(false)}
        />
      )}
    </>
  )
}
