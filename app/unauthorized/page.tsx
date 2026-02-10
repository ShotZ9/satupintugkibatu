'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      ; (async () => {
        await fetch('/auth/logout', { method: 'POST' })
        router.replace('/login')
      })()
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3 border p-6 rounded bg-white">
        <h1 className="text-xl font-bold text-red-600">
          Akses Ditolak
        </h1>
        <p className="text-sm text-gray-600">
          Kamu tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <p className="text-xs text-gray-400">
          Kamu akan diarahkan kembali ke halaman login dalam 5 detik…
        </p>
      </div>
    </main>
  )
}