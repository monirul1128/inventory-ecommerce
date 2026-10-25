'use client'
import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-4">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-800">কিছু একটা ভুল হয়েছে!</h2>
      <p className="text-gray-500 text-sm">{error.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm"
      >
        আবার চেষ্টা করুন
      </button>
    </div>
  )
}
