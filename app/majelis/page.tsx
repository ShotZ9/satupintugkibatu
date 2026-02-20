'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Spinner from '../components/Spinner'

export default function MajelisPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])
    const [catatan, setCatatan] = useState<Record<string, string>>({})
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [actionAccLoading, setActionAccLoading] = useState<string | null>(null)
    const [actionRejectLoading, setActionRejectLoading] = useState<string | null>(null)

    const statusMeta: Record<string, { label: string; color: string }> = {
        menunggu_majelis: {
            label: 'Perlu ACC',
            color: 'bg-yellow-100 text-yellow-800'
        },
        menunggu_admin: {
            label: 'Menunggu Admin',
            color: 'bg-orange-100 text-orange-800'
        },
        dikerjakan_admin: {
            label: 'Sedang Dikerjakan',
            color: 'bg-blue-100 text-blue-800'
        },
        selesai: {
            label: 'Selesai',
            color: 'bg-green-100 text-green-800'
        }
    }

    function SkeletonCard() {
        return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="flex justify-between mb-4">
                    <div>
                        <div className="h-4 w-32 bg-neutral-200 rounded mb-2" />
                        <div className="h-3 w-20 bg-neutral-200 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-neutral-200 rounded-full" />
                </div>

                <div className="space-y-2 mb-4">
                    <div className="h-3 w-40 bg-neutral-200 rounded" />
                    <div className="h-3 w-32 bg-neutral-200 rounded" />
                    <div className="h-3 w-24 bg-neutral-200 rounded" />
                </div>

                <div className="h-16 w-full bg-neutral-200 rounded mb-4" />

                <div className="flex gap-2">
                    <div className="h-8 w-20 bg-neutral-200 rounded" />
                    <div className="h-8 w-20 bg-neutral-200 rounded" />
                </div>
            </div>
        )
    }

    async function loadData() {
        setPageLoading(true)

        const tigaHariLalu = new Date()
        tigaHariLalu.setDate(tigaHariLalu.getDate() - 3)

        const { data } = await supabase
            .from('requests')
            .select('*')
            .eq('archived', false)
            .or(
                `status.neq.selesai,and(status.eq.selesai,selesai_at.gte.${tigaHariLalu.toISOString()})`
            )
            .order('tanggal_pengajuan', { ascending: false })

        setRequests(data || [])
        setPageLoading(false)
    }

    async function acc(id: string) {
        setActionAccLoading(id)

        await supabase
            .from('requests')
            .update({
                status: 'menunggu_admin',
                catatan_majelis: catatan[id] || null
            })
            .eq('id', id)

        await loadData()
        setActionAccLoading(null)
    }

    async function reject(id: string) {
        setActionRejectLoading(id)
        await supabase.from('requests').delete().eq('id', id)
        await loadData()
        setActionRejectLoading(null)
    }

    async function logout() {
        setLogoutLoading(true)
        await fetch('/auth/logout', { method: 'POST' })
        // bersihkan hard session limit
        localStorage.removeItem('login_time')
        router.replace('/login')
    }

    useEffect(() => {
        loadData()

        const channel = supabase
            .channel('realtime-requests-majelis')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requests'
                },
                (payload) => {
                    console.log('Realtime change:', payload)
                    loadData() // 🔥 auto reload data
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <main className="min-h-screen bg-neutral-50 p-6">
            {/* NAVBAR */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className="mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Left */}
                    <h1 className="text-lg md:text-xl font-semibold text-neutral-800">
                        Dashboard Majelis
                    </h1>

                    {/* Right */}
                    <div className="flex items-center gap-6 text-sm">

                        <button
                            onClick={() => router.push('/majelis/riwayat')}
                            className="text-neutral-600 hover:text-neutral-900 transition"
                        >
                            Riwayat
                        </button>

                        <button
                            onClick={logout}
                            disabled={logoutLoading}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 transition disabled:opacity-60"
                        >
                            {logoutLoading && (
                                <span className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            )}
                            {logoutLoading ? 'Keluar...' : 'Logout'}
                        </button>

                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-4">
                {pageLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : requests.length === 0 ? (
                    <div className="text-sm text-neutral-500 text-center py-10">
                        Tidak ada permintaan saat ini
                    </div>
                ) : (
                    requests.map((req) => (
                        <div
                            key={req.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                        >
                            {/* HEADER */}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-lg font-semibold text-neutral-800">
                                        {req.nama_pengisi}
                                    </p>
                                    <p className="text-sm text-neutral-500">
                                        {req.status_pengisi}
                                    </p>
                                </div>

                                <span
                                    className={`text-xs px-3 py-1 rounded-full ${statusMeta[req.status]?.color}`}
                                >
                                    {statusMeta[req.status]?.label}
                                </span>
                            </div>

                            {/* DETAIL */}
                            <div className="text-sm text-neutral-700 space-y-1 mb-3">
                                <p>
                                    <span className="font-medium">WhatsApp:</span>{' '}
                                    <a
                                        href={`https://wa.me/${req.whatsapp}`}
                                        target="_blank"
                                        className="text-green-600 underline"
                                    >
                                        {req.whatsapp}
                                    </a>
                                </p>
                                <p>
                                    <span className="font-medium">Tanggal Diminta:</span>{' '}
                                    {req.tanggal_diminta}
                                </p>
                                <p className="text-neutral-500">
                                    Diajukan:{' '}
                                    {new Date(req.tanggal_pengajuan).toLocaleString()}
                                </p>
                            </div>

                            {/* PESAN */}
                            <div className="bg-neutral-50 border text-neutral-700 border-neutral-200 rounded-lg p-3 text-sm mb-4">
                                {req.pesan}
                            </div>

                            {/* ACTION */}
                            {req.status === 'menunggu_majelis' && (
                                <>
                                    <textarea
                                        placeholder="Catatan untuk admin (opsional)"
                                        className="w-full mb-3 rounded-lg border border-neutral-300 px-3 py-2 text-sm
                             text-neutral-900 placeholder:text-neutral-500
                             focus:outline-none focus:ring-2 focus:ring-neutral-800"
                                        value={catatan[req.id] || ''}
                                        onChange={(e) =>
                                            setCatatan({ ...catatan, [req.id]: e.target.value })
                                        }
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acc(req.id)}
                                            disabled={actionAccLoading === req.id}
                                            className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-800 disabled:opacity-60"
                                        >
                                            {actionAccLoading === req.id && <Spinner size={14} />}
                                            ACC
                                        </button>

                                        <button
                                            onClick={() => reject(req.id)}
                                            disabled={actionRejectLoading === req.id}
                                            className="flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-800 disabled:opacity-60"
                                        >
                                            {actionRejectLoading === req.id && <Spinner size={14} />}
                                            Tolak
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )))}
            </div>
        </main>
    )
}