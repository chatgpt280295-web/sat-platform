'use client'

import { useState } from 'react'
import { KeyRound, Power } from 'lucide-react'
import { toggleUserStatus } from './actions'
import ResetPasswordModal from './ResetPasswordModal'

interface Props {
  userId: string
  studentName: string
  status: string
}

export default function UserActionsClient({ userId, studentName, status }: Props) {
  const [showReset, setShowReset]   = useState(false)
  const [toggling, setToggling]     = useState(false)
  const [curStatus, setCurStatus]   = useState(status)

  async function handleToggle() {
    setToggling(true)
    const res = await toggleUserStatus(userId, curStatus)
    if (!res.error) setCurStatus(curStatus === 'active' ? 'inactive' : 'active')
    setToggling(false)
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {/* Reset password */}
        <button
          onClick={() => setShowReset(true)}
          title="Đổi mật khẩu"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <KeyRound size={13} />
          Đổi MK
        </button>

        {/* Toggle status */}
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
          {toggling ? '...' : curStatus === 'active' ? 'Khóa' : 'Mở khóa'}
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
