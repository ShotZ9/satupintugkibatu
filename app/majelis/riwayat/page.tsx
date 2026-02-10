'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
// import * as XLSX from 'xlsx'
// import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function RiwayatMajelisPage() {
    const router = useRouter()
    const [requests, setRequests] = useState<any[]>([])
    const [bulan, setBulan] = useState<string>('')

    const statusMeta: Record<string, string> = {
        menunggu_majelis: 'Menunggu Majelis',
        menunggu_admin: 'Menunggu Admin',
        dikerjakan_admin: 'Sedang Dikerjakan',
        selesai: 'Selesai'
    }

    // function exportExcel(data: any[]) {
    //     const formatted = data.map((r) => ({
    //         Nama: r.nama_pengisi,
    //         Status_Pengisi: r.status_pengisi,
    //         WhatsApp: r.whatsapp,
    //         Pesan: r.pesan,
    //         Tanggal_Diminta: r.tanggal_diminta,
    //         Tanggal_Selesai: r.selesai_at
    //             ? new Date(r.selesai_at).toLocaleString()
    //             : '',
    //         Catatan_Majelis: r.catatan_majelis || ''
    //     }))

    //     const worksheet = XLSX.utils.json_to_sheet(formatted)
    //     const workbook = XLSX.utils.book_new()
    //     XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat')

    //     const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    //     saveAs(
    //         new Blob([buffer], { type: 'application/octet-stream' }),
    //         `riwayat-permintaan.xlsx`
    //     )
    // }
    function exportPDF(data: any[]) {
        const doc = new jsPDF()

        autoTable(doc, {
            head: [[
                'Nama',
                'Status',
                'WhatsApp',
                'Pesan',
                'Tgl Diminta',
                'Tgl Selesai'
            ]],
            body: data.map(r => [
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

    async function loadData() {
        let query = supabase
            .from('requests')
            .select('*')
            .eq('archived', true)
            .order('selesai_at', { ascending: false })

        // filter per bulan (YYYY-MM)
        if (bulan) {
            const start = `${bulan}-01`
            const end = new Date(bulan + '-01')
            end.setMonth(end.getMonth() + 1)

            query = query
                .gte('selesai_at', start)
                .lt('selesai_at', end.toISOString())
        }

        const { data } = await query
        setRequests(data || [])
    }

    useEffect(() => {
        loadData()
    }, [bulan])

    return (
        <main className="p-4">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Riwayat Permintaan</h1>
                {/* <button
                    onClick={() => exportExcel(requests)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                >
                    Export Excel
                </button> */}
                <button
                    onClick={() => exportPDF(requests)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded"
                >
                    Export PDF
                </button>
                <button
                    onClick={() => router.push('/majelis')}
                    className="text-sm text-blue-600 underline"
                >
                    Kembali ke Dashboard
                </button>
            </div>

            {/* FILTER */}
            <div className="mb-4">
                <label className="text-sm font-semibold block mb-1">
                    Filter Bulan
                </label>
                <input
                    type="month"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="border px-2 py-1 rounded"
                />
            </div>

            {/* DATA */}
            {requests.length === 0 && (
                <p className="text-sm text-gray-500">Tidak ada data riwayat.</p>
            )}

            {requests.map((req) => (
                <div key={req.id} className="border rounded p-4 mb-4">
                    <div className="mb-2">
                        <p className="font-bold">{req.nama_pengisi}</p>
                        <p className="text-sm text-gray-600">{req.status_pengisi}</p>
                    </div>

                    <div className="text-sm space-y-1 mb-2">
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

                    <div className="bg-gray-50 border rounded p-2 text-sm mb-2">
                        {req.pesan}
                    </div>

                    {req.catatan_majelis && (
                        <div className="text-sm bg-yellow-50 border-l-4 border-yellow-500 p-2">
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