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
            .update({
                status: 'selesai',
                selesai_at: new Date().toISOString()
            })
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
        <main className="p-4">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Dashboard Admin</h1>
                <button onClick={logout} className="text-sm text-red-600 underline">
                    Logout
                </button>
            </div>

            {requests.map(req => (
                <div key={req.id} className="border p-3 rounded mb-4">
                    {/* HEADER IDENTITAS */}
                    <div className="mb-2">
                        <p className="font-bold text-lg">{req.nama_pengisi}</p>
                        <p className="text-sm text-gray-600">
                            {req.status_pengisi}
                        </p>
                    </div>

                    {/* DETAIL */}
                    <div className="text-sm space-y-1 mb-2">
                        <p>
                            <span className="font-semibold">WhatsApp:</span>{' '}
                            <a
                                href={`https://wa.me/${req.whatsapp}`}
                                target="_blank"
                                className="text-green-600 underline"
                            >
                                {req.whatsapp}
                            </a>
                        </p>

                        <p>
                            <span className="font-semibold">Tanggal Diminta:</span>{' '}
                            {req.tanggal_diminta}
                        </p>

                        <p>
                            <span className="font-semibold">Diajukan:</span>{' '}
                            {new Date(req.tanggal_pengajuan).toLocaleString()}
                        </p>
                    </div>

                    {/* PESAN */}
                    <div className="bg-gray-50 border rounded p-2 mb-2 text-sm">
                        {req.pesan}
                    </div>

                    {/* CATATAN MAJELIS */}
                    {req.catatan_majelis && (
                        <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-500 text-sm">
                            <b>Catatan Majelis:</b>
                            <br />
                            {req.catatan_majelis}
                        </div>
                    )}

                    {/* ACTION */}
                    <div className="mt-2 flex gap-2">
                        {req.status === 'menunggu_admin' && (
                            <button
                                onClick={() => mulaiKerjakan(req.id)}
                                className="bg-orange-600 text-white px-3 py-1 rounded"
                            >
                                Mulai Kerjakan
                            </button>
                        )}

                        <button
                            onClick={() => selesai(req.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                            Tandai Selesai
                        </button>
                    </div>
                </div>
            ))}
        </main>
    )
}