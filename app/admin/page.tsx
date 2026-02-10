'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])

    async function loadData() {
        const { data } = await supabase
            .from('requests')
            .select('*')
            .in('status', ['menunggu_admin', 'dikerjakan_admin'])
            .order('tanggal_pengajuan', { ascending: false })

        setRequests(data || [])
    }

    async function mulaiKerjakan(id: string) {
        await supabase
            .from('requests')
            .update({ status: 'dikerjakan_admin' })
            .eq('id', id)

        loadData()
    }

    async function selesai(id: string) {
        await supabase
            .from('requests')
            .update({ status: 'selesai', selesai_at: new Date().toISOString(), archived: true })
            .eq('id', id)

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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-neutral-800">
                    Dashboard Admin
                </h1>
                <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:text-red-700"
                >
                    Logout
                </button>
            </div>

            <div className="space-y-4">
                {requests.map((req) => (
                    <div
                        key={req.id}
                        className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                    >
                        <p className="text-lg font-semibold text-neutral-800">
                            {req.nama_pengisi}
                        </p>
                        <p className="text-sm text-neutral-500 mb-2">
                            {req.status_pengisi}
                        </p>

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
                        </div>

                        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm mb-3">
                            {req.pesan}
                        </div>

                        {req.catatan_majelis && (
                            <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm">
                                <b>Catatan Majelis:</b>
                                <br />
                                {req.catatan_majelis}
                            </div>
                        )}

                        <div className="flex gap-2">
                            {req.status === 'menunggu_admin' && (
                                <button
                                    onClick={() => mulaiKerjakan(req.id)}
                                    className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm hover:bg-neutral-800"
                                >
                                    Mulai Kerjakan
                                </button>
                            )}

                            <button
                                onClick={() => selesai(req.id)}
                                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                            >
                                Tandai Selesai
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}