'use client'
import { useState } from 'react'
import { updateAttendanceStatus } from '../actions'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'late',    label: 'Đi muộn', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'absent',  label: 'Vắng',    color: 'text-red-500 bg-red-50 border-red-200' },
]

export default function AttendanceActions({
  sessionId, userId, currentStatus, checkedInAt
}: { sessionId: string; userId: string; currentStatus: string; checkedInAt?: string }) {
  const [status, setStatus]   = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: string) {
    setLoading(true)
    await updateAttendanceStatus(sessionId, userId, newStatus)
    setStatus(newStatus)
    setLoading(false)
  }

  const current = STATUS_OPTIONS.find(s => s.value === status)

  return (
    <div className="flex items-center gap-2">
      {checkedInAt && (
        <span className="text-xs text-gray-400">
          {new Date(checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer disabled:opacity-50 ${current?.color}`}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
