'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Spinner from '../components/Spinner'

export default function MajelisPage() {
    const router = useRouter()
    const [allRequests, setAllRequests] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [catatan, setCatatan] = useState<Record<string, string>>({})
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [actionAccLoading, setActionAccLoading] = useState<string | null>(null)
    const [actionRejectLoading, setActionRejectLoading] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'warta' | 'saran'>('all')

    const filteredRequests = requests
        .filter((r) => {
            if (filter === 'all') return true
            return r.jenis === filter
        })
        .filter((r) => {
            if (!search) return true

            const keyword = search.toLowerCase()

            return Object.values(r).some((val) =>
                String(val ?? '')
                    .toLowerCase()
                    .includes(keyword)
            )
        })

    const pendingWarta = requests.filter(
        (r) => r.jenis === 'warta' && r.status === 'menunggu_majelis'
    ).length

    const pendingSaran = requests.filter(
        (r) => r.jenis === 'saran' && r.status === 'menunggu_majelis'
    ).length

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const bulanIni = allRequests.filter(
        (r) => new Date(r.tanggal_pengajuan) >= startOfMonth
    )

    const totalWartaBulanIni = bulanIni.filter(r => r.jenis === 'warta').length
    const totalSaranBulanIni = bulanIni.filter(r => r.jenis === 'saran').length

    const statusMeta: Record<string, { label: string; color: string }> = {
        menunggu_majelis: {
            label: 'Perlu ACC',
            color: 'bg-yellow-100 text-yellow-800'
        },
        ditolak_majelis: {
            label: 'Ditolak',
            color: 'bg-red-100 text-red-800'
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

        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .order('tanggal_pengajuan', { ascending: false })

        if (error) {
            console.error(error)
            setPageLoading(false)
            return
        }

        const allData = data || []

        setAllRequests(allData)

        const activeRequests = allData.filter(
            (r) => !r.archived && r.status !== 'selesai'
        )

        setRequests(activeRequests)
        setPageLoading(false)
    }

    async function acc(req: any) {
        setActionAccLoading(req.id)

        const isSaran = req.jenis === 'saran'
        const newStatus = isSaran ? 'selesai' : 'menunggu_admin'

        const updateData: any = {
            status: newStatus,
            catatan_majelis: req.jenis === 'warta'
                ? catatan[req.id] || null
                : null
        }

        // kalau selesai → set selesai_at + archived
        if (newStatus === 'selesai') {
            updateData.selesai_at = new Date().toISOString()
            updateData.archived = true
        }

        const { error } = await supabase
            .from('requests')
            .update(updateData)
            .eq('id', req.id)

        if (error) {
            alert('Gagal ACC: ' + error.message)
        }

        await loadData()
        setActionAccLoading(null)
    }

    async function reject(req: any) {
        setActionRejectLoading(req.id)

        const { error } = await supabase
            .from('requests')
            .update({
                status: 'ditolak_majelis',
                archived: true,
                selesai_at: new Date().toISOString()
            })
            .eq('id', req.id)

        if (error) {
            alert('Gagal Tolak: ' + error.message)
        }

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
                    event: 'INSERT',
                    schema: 'public',
                    table: 'requests'
                },
                () => {
                    loadData()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'requests'
                },
                () => {
                    loadData()
                }
            )
            .subscribe((status) => {
                console.log('Realtime status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <main className="min-h-screen p-6">
            {/* NAVBAR */}
            <div className="sticky top-6 z-30 bg-white/80 backdrop-blur-sm border-b rounded-full border-neutral-200">
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">

                {/* FILTER BUTTONS */}
                <div className="flex gap-2">
                    {['all', 'warta', 'saran'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition
                ${filter === f
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            {f === 'all' ? 'Semua' : f === 'warta' ? 'Warta' : 'Saran'}
                        </button>
                    ))}
                </div>

                {/* SEARCH */}
                <div className="relative w-full md:w-72">
                    <input
                        type="text"
                        placeholder="Cari request..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm
                       text-neutral-900 placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />

                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 text-sm"
                        >
                            ✕
                        </button>
                    )}
                </div>

            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

                {/* Warta Pending */}
                <div className="bg-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-neutral-500">Warta Pending</p>
                    <p className="text-2xl font-semibold text-neutral-800">
                        {pendingWarta}
                    </p>
                </div>

                {/* Saran Pending */}
                <div className="bg-purple-100 border border-purple-200 border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-neutral-500">Saran Pending</p>
                    <p className="text-2xl font-semibold text-neutral-800">
                        {pendingSaran}
                    </p>
                </div>

                {/* Warta Bulan Ini */}
                <div className="bg-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-neutral-500">Warta Bulan Ini</p>
                    <p className="text-2xl font-semibold text-neutral-800">
                        {totalWartaBulanIni}
                    </p>
                </div>

                {/* Saran Bulan Ini */}
                <div className="bg-purple-100 border border-purple-200 border rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-neutral-500">Saran Bulan Ini</p>
                    <p className="text-2xl font-semibold text-neutral-800">
                        {totalSaranBulanIni}
                    </p>
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
                    filteredRequests.map((req) => (
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

                                {/* RIGHT BADGES */}
                                <div className="flex flex-col items-end gap-2">

                                    {/* JENIS */}
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-medium ${req.jenis === 'warta'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}
                                    >
                                        {req.jenis === 'warta' ? 'Warta Jemaat' : 'Kotak Saran'}
                                    </span>

                                    {/* STATUS */}
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full ${statusMeta[req.status]?.color}`}
                                    >
                                        {statusMeta[req.status]?.label}
                                    </span>

                                </div>
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
                                {req.jenis === 'warta' && (<p>
                                    <span className="font-medium">Tanggal Diminta:</span>{' '}
                                    {req.tanggal_diminta}
                                </p>
                                )}
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
                                    {req.jenis === 'warta' && (
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
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acc(req)}
                                            disabled={actionAccLoading === req.id}
                                            className="flex items-center gap-2 rounded-lg bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-800 disabled:opacity-60"
                                        >
                                            {actionAccLoading === req.id && <Spinner size={14} />}
                                            ACC
                                        </button>

                                        <button
                                            onClick={() => reject(req)}
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