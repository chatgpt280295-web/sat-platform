'use client'

import { useTransition } from 'react'
import { toggleUserStatus } from './actions'
import { Power, PowerOff } from 'lucide-react'

interface Props { id: string; status: string; onDone: () => void }

export default function UserActions({ id, status, onDone }: Props) {
  const [isPending, start] = useTransition()
  const isActive = status === 'active'

  function handleToggle() {
    if (!confirm(isActive ? 'Tắt tài khoản học viên này?' : 'Kích hoạt lại tài khoản?')) return
    start(async () => { await toggleUserStatus(id, status); onDone() })
  }

  return (
    <button onClick={handleToggle} disabled={isPending} title={isActive ? 'Tắt' : 'Bật'}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors
        ${isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {isActive ? <PowerOff size={14}/> : <Power size={14}/>}
      {isActive ? 'Tắt' : 'Bật'}
    </button>
  )
}
