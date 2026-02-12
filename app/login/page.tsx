'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [shake, setShake] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const form = e.currentTarget
    const email = form.email.value
    const password = form.password.value

    // 1️⃣ LOGIN
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      setErrorMsg('Email atau password salah')

      setShake(false)
      setTimeout(() => setShake(true), 10)
      setTimeout(() => setShake(false), 500)

      setLoading(false)
      return
    }

    // 🔥 SIMPAN WAKTU LOGIN (HARD LIMIT 8 JAM)
    localStorage.setItem('login_time', Date.now().toString())

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
        className={`w-full max-w-sm bg-white border rounded-2xl p-6 space-y-4 shadow-sm transition-all duration-300
    ${errorMsg ? 'border-red-400' : 'border-neutral-200'}
    ${shake ? 'animate-shake' : ''}
  `}
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

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            required
            onKeyUp={(e) =>
              setCapsLock(e.getModifierState && e.getModifierState('CapsLock'))
            }
            onKeyDown={(e) =>
              setCapsLock(e.getModifierState && e.getModifierState('CapsLock'))
            }
            className="input pr-10 text-neutral-900 placeholder:text-neutral-500"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {capsLock && (
          <p className="text-xs text-red-500 -mt-2">
            Caps Lock aktif
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-red-500 text-center animate-fadeIn">
            {errorMsg}
          </p>
        )}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium
             hover:bg-neutral-800 transition disabled:opacity-60
             flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </main>
  )
}