'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// import * as XLSX from 'xlsx'
// import { saveAs } from 'file-saver'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Chart } from 'chart.js/auto'

type Statistik = {
    total: number
    perStatusPengisi: Record<string, number>
    perStatus: Record<string, number>
}

export default function RiwayatMajelisPage() {
    const router = useRouter()

    const [requests, setRequests] = useState<any[]>([])
    const [bulan, setBulan] = useState<string>('')
    const [statistik, setStatistik] = useState<Statistik | null>(null)

    const statusMeta: Record<string, string> = {
        menunggu_majelis: 'Menunggu Majelis',
        menunggu_admin: 'Menunggu Admin',
        dikerjakan_admin: 'Sedang Dikerjakan',
        selesai: 'Selesai'
    }

    async function exportPDF(data: any[]) {
        const doc = new jsPDF()

        // ===== JUDUL =====
        doc.setFontSize(14)
        doc.text('Riwayat Permintaan', 14, 15)

        // ===== STATISTIK =====
        if (statistik) {
            doc.setFontSize(10)
            doc.text(`Total Permintaan: ${statistik.total}`, 14, 25)

            // ===== GRAFIK =====
            const chartImg = await generateChartImage(statistik)
            doc.addImage(chartImg, 'PNG', 14, 30, 80, 60)
        }

        // ===== TABLE =====
        autoTable(doc, {
            startY: statistik ? 100 : 30,
            head: [[
                'Nama',
                'Status',
                'WhatsApp',
                'Pesan',
                'Tgl Diminta',
                'Tgl Selesai'
            ]],
            body: data.map((r) => [
                r.nama_pengisi,
                r.status_pengisi,
                r.whatsapp,
                r.pesan,
                r.tanggal_diminta,
                r.selesai_at
                    ? new Date(r.selesai_at).toLocaleDateString()
                    : ''
            ])
        })

        doc.save('riwayat-permintaan.pdf')
    }

    async function generateChartImage(statistik: Statistik) {
        return new Promise<string>((resolve) => {
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 300

            const ctx = canvas.getContext('2d')!

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: Object.keys(statistik.perStatus),
                    datasets: [
                        {
                            label: 'Jumlah Permintaan',
                            data: Object.values(statistik.perStatus),
                        }
                    ]
                },
                options: {
                    responsive: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            })

            // tunggu render
            setTimeout(() => {
                resolve(canvas.toDataURL('image/png'))
            }, 500)
        })
    }

    async function loadData() {
        let query = supabase
            .from('requests')
            .select('*')
            .eq('archived', true)
            .order('selesai_at', { ascending: false })

        // filter per bulan (YYYY-MM)
        if (bulan) {
            const start = `${bulan}-01`
            const end = new Date(`${bulan}-01`)
            end.setMonth(end.getMonth() + 1)

            query = query
                .gte('selesai_at', start)
                .lt('selesai_at', end.toISOString())
        }

        const { data } = await query
        const rows = data || []

        setRequests(rows)
        setStatistik(hitungStatistik(rows))
    }

    function hitungStatistik(data: any[]): Statistik {
        const perStatusPengisi: Record<string, number> = {}
        const perStatus: Record<string, number> = {}

        data.forEach((r) => {
            // status pengisi
            perStatusPengisi[r.status_pengisi] =
                (perStatusPengisi[r.status_pengisi] || 0) + 1

            // status proses
            perStatus[r.status] =
                (perStatus[r.status] || 0) + 1
        })

        return {
            total: data.length,
            perStatusPengisi,
            perStatus
        }
    }

    useEffect(() => {
        loadData()
    }, [bulan])

    return (
        <main className="min-h-screen p-4 bg-gray-50">
            {/* HEADER */}
            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                    Riwayat Permintaan
                </h1>

                <div className="flex gap-2">
                    <button
                        onClick={() => exportPDF(requests)}
                        className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                        Export PDF
                    </button>

                    <button
                        onClick={() => router.push('/majelis')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>

            {/* FILTER */}
            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Filter Bulan
                </label>
                <input
                    type="month"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="
                        border border-gray-300
                        bg-white
                        px-2 py-1 rounded
                        text-gray-900
                        focus:outline-none
                        focus:ring-2 focus:ring-black
                    "
                />
            </div>

            {/* STATISTIK */}
            {statistik && (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="border border-gray-200 rounded p-3 bg-white shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Permintaan{' '}
                            {bulan ? '(Bulan terfilter)' : '(Semua Arsip)'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {statistik.total}
                        </p>
                    </div>

                    <div className="border border-gray-200 rounded p-3 bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                            Berdasarkan Pengisi
                        </p>
                        <ul className="text-sm space-y-1 text-gray-700">
                            {Object.entries(statistik.perStatusPengisi).map(
                                ([k, v]) => (
                                    <li key={k} className="flex justify-between">
                                        <span>{k}</span>
                                        <span className="font-semibold">
                                            {v}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    <div className="border border-gray-200 rounded p-3 bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                            Status Proses
                        </p>
                        <ul className="text-sm space-y-1 text-gray-700">
                            {Object.entries(statistik.perStatus).map(
                                ([k, v]) => (
                                    <li key={k} className="flex justify-between">
                                        <span>{statusMeta[k] ?? k}</span>
                                        <span className="font-semibold">
                                            {v}
                                        </span>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* DATA */}
            {requests.length === 0 && (
                <p className="text-sm text-gray-500">
                    Tidak ada data riwayat.
                </p>
            )}

            {requests.map((req) => (
                <div
                    key={req.id}
                    className="border border-gray-200 bg-white rounded p-4 mb-4 shadow-sm"
                >
                    <div className="mb-2">
                        <p className="font-bold text-gray-900">
                            {req.nama_pengisi}
                        </p>
                        <p className="text-sm text-gray-500">
                            {req.status_pengisi}
                        </p>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1 mb-2">
                        <p>
                            <span className="font-semibold">WhatsApp:</span>{' '}
                            {req.whatsapp}
                        </p>
                        <p>
                            <span className="font-semibold">Tanggal Diminta:</span>{' '}
                            {req.tanggal_diminta}
                        </p>
                        <p>
                            <span className="font-semibold">Selesai:</span>{' '}
                            {new Date(req.selesai_at).toLocaleString()}
                        </p>
                        <p>
                            <span className="font-semibold">Status:</span>{' '}
                            {statusMeta[req.status]}
                        </p>
                    </div>

                    <div className="bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-800 mb-2">
                        {req.pesan}
                    </div>

                    {req.catatan_majelis && (
                        <div className="text-sm bg-yellow-50 border-l-4 border-yellow-400 p-2 text-gray-800">
                            <b>Catatan Majelis:</b>
                            <br />
                            {req.catatan_majelis}
                        </div>
                    )}
                </div>
            ))}
        </main>
    )
}