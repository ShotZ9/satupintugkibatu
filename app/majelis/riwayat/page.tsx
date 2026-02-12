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
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)
    const [search, setSearch] = useState('')

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
        setLoading(true)

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
        setLoading(false)
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
        <main className="min-h-screen bg-neutral-50 p-6">
            {/* NAVBAR */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200">
                <div className="mx-auto px-6 h-16 flex items-center justify-between">

                    {/* Left */}
                    <h1 className="text-lg md:text-xl font-semibold text-neutral-800">
                        Riwayat Permintaan
                    </h1>

                    {/* Right */}
                    <div className="flex items-center gap-4 text-sm">

                        <button
                            onClick={() => router.push('/majelis')}
                            className="
          text-neutral-600
          hover:text-neutral-900
          transition
        "
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => exportPDF(requests)}
                            className="
          px-4 py-2 rounded-xl
          bg-red-600 text-white
          hover:bg-red-700
          transition
        "
                        >
                            Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTER */}
            <div className="mt-4 mb-4">
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
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cari Nama Pengisi
                </label>
                <input
                    type="text"
                    placeholder="Ketik nama..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
            w-full md:w-72
            border border-gray-300
            bg-white
            px-3 py-2
            rounded-xl
            text-sm
            text-gray-900
            focus:outline-none
            focus:ring-2 focus:ring-black
            transition
        "
                />
            </div>

            {/* STATISTIK */}
            {statistik && (
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Permintaan{' '}
                            {bulan ? '(Bulan terfilter)' : '(Semua Arsip)'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {statistik.total}
                        </p>
                    </div>

                    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 shadow-sm">
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

                    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 shadow-sm">
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

            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="border border-gray-200 bg-white rounded p-4 shadow-sm animate-pulse"
                        >
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-1/4 mb-4" />

                            <div className="space-y-2 mb-3">
                                <div className="h-3 bg-gray-200 rounded w-full" />
                                <div className="h-3 bg-gray-200 rounded w-5/6" />
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                            </div>

                            <div className="h-12 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* DATA */}
            {!loading && requests.length === 0 && (
                <p className="text-sm text-gray-500">
                    Tidak ada data riwayat.
                </p>
            )}

            {!loading &&
                requests
                    .filter((r) =>
                        r.nama_pengisi
                            ?.toLowerCase()
                            .includes(search.toLowerCase())
                    )
                    .map((req) => {
                        const isOpen = openId === req.id

                        return (
                            <div
                                key={req.id}
                                className="border border-gray-100 bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                {/* HEADER */}
                                <div
                                    onClick={() =>
                                        setOpenId(isOpen ? null : req.id)
                                    }
                                    className="cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {req.nama_pengisi}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {req.status_pengisi}
                                        </p>
                                    </div>

                                    <span className="text-sm text-blue-600">
                                        {isOpen ? 'Tutup ▲' : 'Lihat Detail ▼'}
                                    </span>
                                </div>

                                {/* COLLAPSIBLE CONTENT */}
                                <div
                                    className={`
        grid transition-all duration-500 ease-in-out
        ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}
    `}
                                >
                                    <div className="overflow-hidden border-t">
                                        <div className="text-sm text-gray-700 space-y-1 mt-3 mb-3">
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
                                                {req.selesai_at
                                                    ? new Date(req.selesai_at).toLocaleString()
                                                    : '-'}
                                            </p>
                                            <p>
                                                <span className="font-semibold">Status:</span>{' '}
                                                {statusMeta[req.status]}
                                            </p>
                                        </div>

                                        {/* PESAN */}
                                        <div className="bg-gray-100 border border-gray-200 rounded p-3 text-sm text-gray-800 mb-3 whitespace-pre-wrap">
                                            {req.pesan}
                                        </div>

                                        {/* CATATAN */}
                                        {req.catatan_majelis &&
                                            req.catatan_majelis.trim() !== '' && (
                                                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                                                    <div className="text-sm font-semibold text-yellow-800 mb-1">
                                                        Catatan Majelis
                                                    </div>
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {req.catatan_majelis}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>

                        )
                    }
                    )}
        </main >
    )
}