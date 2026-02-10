'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MajelisPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])
    const [catatan, setCatatan] = useState<Record<string, string>>({})

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

    async function loadData() {
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
    }

    async function acc(id: string) {
        await supabase
            .from('requests')
            .update({
                status: 'menunggu_admin',
                catatan_majelis: catatan[id] || null
            })
            .eq('id', id)

        loadData()
    }

    async function reject(id: string) {
        await supabase.from('requests').delete().eq('id', id)
        loadData()
    }

    async function logout() {
        await fetch('/auth/logout', { method: 'POST' })
        router.replace('/login')
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <main className="min-h-screen bg-neutral-50 p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-neutral-800">
                    Dashboard Majelis
                </h1>

                <div className="flex gap-4 text-sm">
                    <button
                        onClick={() => router.push('/majelis/riwayat')}
                        className="text-neutral-600 hover:text-neutral-900"
                    >
                        Riwayat
                    </button>
                    <button
                        onClick={logout}
                        className="text-red-600 hover:text-red-700"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {requests.map((req) => (
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
                                        className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-800"
                                    >
                                        ACC
                                    </button>
                                    <button
                                        onClick={() => reject(req.id)}
                                        className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-800"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </main>
    )
}