'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { motion, AnimatePresence } from 'framer-motion'

type Statistik = {
    total: number
    perStatusPengisi: Record<string, number>
    perStatus: Record<string, number>
}

export default function RiwayatMajelisPage() {
    const router = useRouter()

    const [tahun, setTahun] = useState('')
    const [jenisFilter, setJenisFilter] = useState<'all' | 'warta' | 'saran'>('all')
    const [requests, setRequests] = useState<any[]>([])
    const [bulan, setBulan] = useState<string>('')
    const [statistik, setStatistik] = useState<Statistik | null>(null)
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [openExport, setOpenExport] = useState(false)
    const [exportTahun, setExportTahun] = useState('')
    const [exportBulan, setExportBulan] = useState('')
    const [exportJenis, setExportJenis] = useState<'all' | 'warta' | 'saran'>('all')
    const [exportVisible, setExportVisible] = useState(false)

    const filteredRequests = requests
        .filter((r) => {
            if (jenisFilter === 'all') return true
            return r.jenis === jenisFilter
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

    function formatTanggal(dateString?: string) {
        if (!dateString) return '-'

        const date = new Date(dateString)

        return date.toLocaleDateString('id-ID')
    }

    const statusMeta: Record<string, string> = {
        menunggu_majelis: 'Menunggu Majelis',
        ditolak_majelis: 'Ditolak',
        menunggu_admin: 'Menunggu Admin',
        dikerjakan_admin: 'Sedang Dikerjakan',
        selesai: 'Selesai'
    }

    async function getExportData() {
        let query = supabase
            .from('requests')
            .select('*')
            .eq('archived', true)

        if (exportTahun) {
            query = query
                .gte('selesai_at', `${exportTahun}-01-01`)
                .lt('selesai_at', `${Number(exportTahun) + 1}-01-01`)
        }

        if (exportBulan) {
            const start = `${exportBulan}-01`
            const end = new Date(start)
            end.setMonth(end.getMonth() + 1)

            query = query
                .gte('selesai_at', start)
                .lt('selesai_at', end.toISOString())
        }

        const { data } = await query
        let rows = data || []

        if (exportJenis !== 'all') {
            rows = rows.filter(r => r.jenis?.toLowerCase() === exportJenis)
        }

        return rows
    }

    function sortByJenis(data: any[]) {
        return data.sort((a, b) => {
            if (a.jenis === b.jenis) return 0
            if (a.jenis === 'warta') return -1
            return 1
        })
    }

    async function exportPDF() {
        let rows = await getExportData()
        rows = sortByJenis(rows)
        const stat = hitungStatistik(rows)

        const orientation = rows.length > 20 ? 'landscape' : 'portrait'

        const doc = new jsPDF({
            orientation,
            unit: 'mm',
            format: 'a4'
        })

        const logo = await loadLogo()

        // ===== HEADER =====
        doc.addImage(logo, 'PNG', 14, 10, 20, 20)

        doc.setFontSize(14)
        doc.text('GKI Batu', 40, 18)

        doc.setFontSize(11)
        doc.text('Riwayat Permintaan', 40, 24)

        doc.setFontSize(9)
        doc.text(
            `Periode: ${exportTahun || 'Semua Tahun'} ${exportBulan ? '- ' + exportBulan : ''}`,
            40,
            29
        )

        // ===== STATISTIK =====
        let y = 40
        doc.setFontSize(10)
        doc.text(`Total: ${stat.total}`, 14, y)
        y += 6

        Object.entries(stat.perJenis).forEach(([k, v]) => {
            doc.text(`${k.toUpperCase()}: ${v}`, 14, y)
            y += 5
        })

        y += 4

        // ===== TABLE =====
        autoTable(doc, {
            startY: y,
            head: [[
                'Nama', 'Jenis', 'Status', 'WA',
                'Pesan', 'Tgl Diminta', 'Tgl Selesai'
            ]],
            body: rows.map(r => [
                r.nama_pengisi,
                r.jenis?.toUpperCase(),
                statusMeta[r.status] ?? r.status,
                r.whatsapp,
                r.pesan,
                formatTanggal(r.tanggal_diminta),
                formatTanggal(r.selesai_at)
            ]),
            didDrawPage: (data) => {
                const pageCount = doc.getNumberOfPages()
                const pageSize = doc.internal.pageSize
                const pageHeight = pageSize.height || pageSize.getHeight()

                doc.setFontSize(8)

                // Footer kiri
                doc.text(
                    `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
                    14,
                    pageHeight - 10
                )

                // Footer kanan
                doc.text(
                    `Halaman ${doc.getCurrentPageInfo().pageNumber} dari ${pageCount}`,
                    pageSize.width - 14,
                    pageHeight - 10,
                    { align: 'right' }
                )
            }
        })

        doc.save(generateFileName('pdf'))
    }

    async function exportExcel() {
        let rows = await getExportData()
        rows = sortByJenis(rows)
        const stat = hitungStatistik(rows)

        const formatted = rows.map(r => ({
            Nama: r.nama_pengisi,
            Jenis: r.jenis?.toUpperCase(),
            Status: statusMeta[r.status] ?? r.status,
            WA: r.whatsapp,
            Pesan: r.pesan,
            Tgl_Diminta: formatTanggal(r.tanggal_diminta),
            Tgl_Selesai: formatTanggal(r.selesai_at)
        }))

        const wsData = XLSX.utils.json_to_sheet(formatted)

        const statSheet = XLSX.utils.json_to_sheet([
            { Kategori: 'Total', Jumlah: stat.total },
            ...Object.entries(stat.perJenis).map(([k, v]) => ({
                Kategori: `Jenis - ${k}`,
                Jumlah: v
            }))
        ])

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, wsData, 'Data')
        XLSX.utils.book_append_sheet(wb, statSheet, 'Statistik')

        const excelBuffer = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array'
        })

        const file = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        saveAs(file, generateFileName('xlsx'))
    }

    function generateFileName(ext: 'pdf' | 'xlsx') {
        const parts = ['riwayat-permintaan']

        if (exportTahun) parts.push(exportTahun)

        if (exportBulan) parts.push(exportBulan)

        if (exportJenis !== 'all') parts.push(exportJenis)

        return parts.join('-') + '.' + ext
    }

    async function loadLogo() {
        const response = await fetch('/vm.png')
        const blob = await response.blob()

        return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
        })
    }

    function closeExportModal() {
        setExportVisible(false)

        setTimeout(() => {
            setOpenExport(false)
        }, 200) // sesuai durasi animasi
    }

    async function loadData() {
        setLoading(true)

        let query = supabase
            .from('requests')
            .select('*')
            .eq('archived', true)
            .order('selesai_at', { ascending: false })

        if (tahun) {
            query = query
                .gte('selesai_at', `${tahun}-01-01`)
                .lt('selesai_at', `${Number(tahun) + 1}-01-01`)
        }

        if (bulan) {
            const start = `${bulan}-01`
            const end = new Date(start)
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

    function hitungStatistik(data: any[]) {
        const perStatusPengisi: any = {}
        const perStatus: any = {}
        const perJenis: any = {}

        data.forEach(r => {
            perStatusPengisi[r.status_pengisi] =
                (perStatusPengisi[r.status_pengisi] || 0) + 1

            perStatus[r.status] =
                (perStatus[r.status] || 0) + 1

            perJenis[r.jenis] =
                (perJenis[r.jenis] || 0) + 1
        })

        return {
            total: data.length,
            perStatusPengisi,
            perStatus,
            perJenis
        }
    }

    useEffect(() => {
        loadData()
    }, [bulan])

    return (
        <main className="min-h-screen p-6">
            {/* NAVBAR */}
            <div className="sticky top-6 z-30 bg-white/80 backdrop-blur-sm border-b rounded-full border-neutral-200">
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
                            onClick={() => {
                                setOpenExport(true)
                                setTimeout(() => setExportVisible(true), 10)
                            }}
                            className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white"
                        >
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-4 mt-4 mb-4">

                {/* TAHUN */}
                <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-800">Tahun</label>
                    <input
                        type="number"
                        placeholder="2026"
                        value={tahun}
                        onChange={(e) => setTahun(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm text-neutral-800"
                    />
                </div>

                {/* BULAN */}
                <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-800">Bulan</label>
                    <input
                        type="month"
                        value={bulan}
                        onChange={(e) => setBulan(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm text-neutral-800"
                    />
                </div>

                {/* JENIS */}
                <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-800">Jenis</label>
                    <div className="flex gap-2">
                        {['all', 'warta', 'saran'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setJenisFilter(f as any)}
                                className={`px-3 py-2 rounded-lg text-sm
                        ${jenisFilter === f
                                        ? 'bg-neutral-900 text-white'
                                        : 'bg-white border text-neutral-600'
                                    }`}
                            >
                                {f === 'all' ? 'Semua' : f === 'warta' ? 'Warta' : 'Saran'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEARCH */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold mb-1 text-neutral-800">Search</label>
                    <input
                        type="text"
                        placeholder="Cari semua field..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border px-3 py-2 rounded-lg text-sm text-neutral-800"
                    />
                </div>
            </div>

            {/* STATISTIK */}
            {statistik && (
                <div className="mb-4 grid gap-4 md:grid-cols-3">
                    <div className="border border-gray-100 bg-white rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-300 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Permintaan{' '}
                            {bulan ? '(Terfilter)' : '(Semua Arsip)'}
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
                filteredRequests.map((req) => {
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
                                    <span
                                        className={`text-xs uppercase font-semibold ${req.jenis === 'warta'
                                            ? 'text-blue-700'
                                            : 'text-purple-700'
                                            }`}
                                    >
                                        {req.jenis === 'warta' ? 'Warta Jemaat' : 'Kotak Saran'}
                                    </span>
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
                                            <a
                                                href={`https://wa.me/${req.whatsapp}`}
                                                target="_blank"
                                                className="text-green-600 underline"
                                            >
                                                {req.whatsapp}
                                            </a>
                                        </p>
                                        {req.jenis === 'warta' && (<p>
                                            <span className="font-semibold">Tanggal Diminta:</span>{' '}
                                            {formatTanggal(req.tanggal_diminta)}
                                        </p>)}
                                        <p>
                                            <span className="font-semibold">Selesai:</span>{' '}
                                            {req.selesai_at
                                                ? formatTanggal(req.selesai_at)
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
            <AnimatePresence>
                {openExport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={closeExportModal}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 relative shadow-2xl"
                        >
                            {/* HEADER */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg text-black font-semibold">
                                    Export Data
                                </h2>

                                <button
                                    onClick={closeExportModal}
                                    className="text-black text-lg font-bold hover:text-red-600 transition"
                                >
                                    ✕
                                </button>
                            </div>


                            {/* FILTER */}
                            <input
                                type="number"
                                placeholder="Tahun"
                                value={exportTahun}
                                onChange={e => setExportTahun(e.target.value)}
                                className="w-full border px-3 py-2 rounded-lg text-black"
                            />

                            <input
                                type="month"
                                value={exportBulan}
                                onChange={e => setExportBulan(e.target.value)}
                                className="w-full border px-3 py-2 rounded-lg text-black"
                            />

                            <div className="flex gap-2">
                                {['all', 'warta', 'saran'].map(j => (
                                    <button
                                        key={j}
                                        onClick={() => setExportJenis(j as any)}
                                        className={`flex-1 py-2 rounded-lg text-sm transition ${exportJenis === j
                                            ? 'bg-neutral-900 text-white'
                                            : 'bg-neutral-100 text-black hover:bg-neutral-200'
                                            }`}
                                    >
                                        {j === 'all' ? 'Semua' : j === 'warta' ? 'Warta' : 'Saran'}
                                    </button>
                                ))}
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 pt-3">
                                <button
                                    onClick={exportPDF}
                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                                >
                                    Export PDF
                                </button>

                                <button
                                    onClick={exportExcel}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                                >
                                    Export Excel
                                </button>
                            </div>

                            {/* CLEAR */}
                            <button
                                onClick={() => {
                                    setExportTahun('')
                                    setExportBulan('')
                                    setExportJenis('all')
                                }}
                                className="w-full text-sm text-neutral-500 hover:text-black pt-2 transition"
                            >
                                Clear Filter
                            </button>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    )
}