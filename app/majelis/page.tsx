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
            label: 'Perlu Di ACC',
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
        const { data } = await supabase
            .from('requests')
            .select('*')
            .eq('archived', false)
            .in('status', [
                'menunggu_majelis',
                'menunggu_admin',
                'dikerjakan_admin',
                'selesai'
            ])
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
        await supabase.auth.signOut()
        router.push('/login')
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <main className="p-4">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Dashboard Majelis</h1>
                <button
                    onClick={() => router.push('/majelis/riwayat')}
                    className="text-sm text-blue-600 underline"
                >
                    Riwayat
                </button>
                <button onClick={logout} className="text-sm text-red-600 underline">
                    Logout
                </button>
            </div>

            {requests.map((req) => (
                <div key={req.id} className="border p-4 rounded mb-4">
                    {/* HEADER IDENTITAS + STATUS */}
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-bold text-lg">{req.nama_pengisi}</p>
                            <p className="text-sm text-gray-600">{req.status_pengisi}</p>
                        </div>

                        <span
                            className={`text-xs px-2 py-1 rounded ${statusMeta[req.status]?.color
                                }`}
                        >
                            {statusMeta[req.status]?.label}
                        </span>
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
                    <div className="bg-gray-50 border rounded p-2 mb-3 text-sm">
                        {req.pesan}
                    </div>

                    {/* ACTION — HANYA JIKA MENUNGGU MAJELIS */}
                    {req.status === 'menunggu_majelis' && (
                        <>
                            <textarea
                                placeholder="Catatan untuk admin (opsional)"
                                className="input mb-2"
                                value={catatan[req.id] || ''}
                                onChange={(e) =>
                                    setCatatan({ ...catatan, [req.id]: e.target.value })
                                }
                            />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => acc(req.id)}
                                    className="bg-green-600 text-white px-3 py-1 rounded"
                                >
                                    ACC
                                </button>
                                <button
                                    onClick={() => reject(req.id)}
                                    className="bg-red-600 text-white px-3 py-1 rounded"
                                >
                                    Tolak
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </main>
    )
}