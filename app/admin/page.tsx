'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Spinner from '../components/Spinner'

export default function AdminPage() {
    const router = useRouter()

    const [requests, setRequests] = useState<any[]>([])
    const [pageLoading, setPageLoading] = useState(true)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

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
                    <div className="h-8 w-24 bg-neutral-200 rounded" />
                    <div className="h-8 w-24 bg-neutral-200 rounded" />
                </div>
            </div>
        )
    }

    async function loadData() {
        setPageLoading(true)

        const { data } = await supabase
            .from('requests')
            .select('*')
            .in('status', ['menunggu_admin', 'dikerjakan_admin'])
            .order('tanggal_pengajuan', { ascending: false })

        setRequests(data || [])
        setPageLoading(false)
    }

    async function mulaiKerjakan(id: string) {
        setActionLoading(id)

        await supabase
            .from('requests')
            .update({ status: 'dikerjakan_admin' })
            .eq('id', id)

        await loadData()
        setActionLoading(null)
    }

    async function selesai(id: string) {
        setActionLoading(id)

        await supabase
            .from('requests')
            .update({
                status: 'selesai',
                selesai_at: new Date().toISOString(),
                archived: true
            })
            .eq('id', id)

        await loadData()
        setActionLoading(null)
    }

    async function logout() {
        setLogoutLoading(true)
        await fetch('/auth/logout', { method: 'POST' })
        localStorage.removeItem('login_time')
        router.replace('/login')
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <main className="min-h-screen bg-neutral-50 p-6">
            {/* HEADER (SAMA PERSIS MAJELIS) */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-neutral-800">
                    Dashboard Admin
                </h1>

                <button
                    onClick={logout}
                    disabled={logoutLoading}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-60 text-sm"
                >
                    {logoutLoading && <Spinner size={14} />}
                    {logoutLoading ? 'Keluar...' : 'Logout'}
                </button>
            </div>

            <div className="space-y-4">
                {pageLoading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : requests.length === 0 ? (
                    <div className="text-sm text-neutral-500 text-center py-10">
                        Tidak ada pekerjaan saat ini
                    </div>
                ) : (
                    requests.map((req) => (
                        <div
                            key={req.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                        >
                            {/* HEADER SAMA PERSIS */}
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

                            {/* DETAIL SAMA */}
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

                            {/* PESAN SAMA */}
                            <div className="bg-neutral-50 border text-neutral-700 border-neutral-200 rounded-lg p-3 text-sm mb-4">
                                {req.pesan}
                            </div>

                            {/* CATATAN MAJELIS (TETAP) */}
                            {req.catatan_majelis && (
                                <div className="mb-4 rounded-lg text-neutral-700 bg-yellow-50 border border-yellow-200 p-3 text-sm">
                                    <b>Catatan Majelis:</b>
                                    <br />
                                    {req.catatan_majelis}
                                </div>
                            )}

                            {/* ACTION KHUSUS ADMIN */}
                            <div className="flex gap-2">
                                {req.status === 'menunggu_admin' && (
                                    <button
                                        onClick={() => mulaiKerjakan(req.id)}
                                        disabled={actionLoading === req.id}
                                        className="flex items-center gap-2 rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800 disabled:opacity-60"
                                    >
                                        {actionLoading === req.id && <Spinner size={14} />}
                                        Mulai Kerjakan
                                    </button>
                                )}

                                {req.status === 'dikerjakan_admin' && (
                                    <button
                                        onClick={() => selesai(req.id)}
                                        disabled={actionLoading === req.id}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {actionLoading === req.id && <Spinner size={14} />}
                                        Tandai Selesai
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    )
}