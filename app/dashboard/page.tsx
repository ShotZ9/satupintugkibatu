'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function checkRole() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        router.push('/login')
        return
      }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('email', auth.user.email)
        .single()

      if (user?.role === 'majelis') {
        router.push('/majelis')
      } else if (user?.role === 'admin') {
        router.push('/admin')
      } else {
        alert('Role tidak dikenal')
      }
    }

    checkRole()
  }, [router])

  return <p className="p-4">Memuat dashboard...</p>
}