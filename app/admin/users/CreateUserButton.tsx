'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import CreateUserModal from './CreateUserModal'

export default function CreateUserButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm">
        <UserPlus size={16} />
        Thêm học viên
      </button>

      {open && <CreateUserModal onClose={() => setOpen(false)} />}
    </>
  )
}
