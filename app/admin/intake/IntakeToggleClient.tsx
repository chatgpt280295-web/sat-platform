'use client'

import { useState, useTransition } from 'react'
import { toggleIntakeQuestion, setAllIntake } from './actions'

export function IntakeToggle({ questionId, checked }: { questionId: string; checked: boolean }) {
  const [on, setOn] = useState(checked)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !on
    setOn(next)
    startTransition(async () => {
      const res = await toggleIntakeQuestion(questionId, next)
      if (res.error) setOn(!next) // rollback
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        on ? 'bg-blue-600' : 'bg-gray-200'
      } ${pending ? 'opacity-50' : ''}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export function SetAllButton({
  domain,
  value,
  label,
}: {
  domain: string
  value: boolean
  label: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => setAllIntake(domain, value))}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
        pending ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        value
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {pending ? '...' : label}
    </button>
  )
}
