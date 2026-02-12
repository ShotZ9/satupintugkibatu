'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000 // 2 jam
const HARD_LIMIT = 8 * 60 * 60 * 1000 // 8 jam

export default function SessionWatcher() {
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      localStorage.removeItem('login_time')
      router.replace('/login')
    }

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      timeoutRef.current = setTimeout(() => {
        logout()
      }, INACTIVITY_LIMIT)
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart']

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    )

    // ✅ SAFE localStorage access
    const loginTime = localStorage.getItem('login_time')

    if (loginTime) {
      const diff = Date.now() - Number(loginTime)

      if (diff > HARD_LIMIT) {
        logout()
      }
    }

    resetTimer()

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      )
    }
  }, [router])

  return null
}