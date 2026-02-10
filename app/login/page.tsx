'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const email = form.email.value
    const password = form.password.value

    // 1️⃣ LOGIN
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      alert(error?.message ?? 'Login gagal')
      setLoading(false)
      return
    }

    // 2️⃣ AMBIL ROLE
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single()

    if (profileError || !profile) {
      alert('Role tidak ditemukan')
      setLoading(false)
      return
    }

    // 3️⃣ REDIRECT SESUAI ROLE
    if (profile.role === 'admin') {
      router.replace('/admin')
    } else if (profile.role === 'majelis') {
      router.replace('/majelis')
    } else {
      router.replace('/unauthorized')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-center text-neutral-800">
          Login Petugas
        </h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="input text-neutral-900 placeholder:text-neutral-500"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="input text-neutral-900 placeholder:text-neutral-500"
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium
                     hover:bg-neutral-800 transition disabled:opacity-60"
        >
          {loading ? 'Masuk...' : 'Login'}
        </button>
      </form>
    </main>
  )
}