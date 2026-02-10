'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(async () => {
      await fetch('/auth/logout', { method: 'POST' })
      router.replace('/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 text-center shadow-sm space-y-3">
        <h1 className="text-lg font-semibold text-red-600">
          Akses Ditolak
        </h1>

        <p className="text-sm text-neutral-600">
          Kamu tidak memiliki izin untuk mengakses halaman ini.
        </p>

        <p className="text-xs text-neutral-400">
          Kamu akan diarahkan ke halaman login dalam 3 detik…
        </p>
      </div>
    </main>
  )
}