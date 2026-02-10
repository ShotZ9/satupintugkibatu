'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)

  const inputClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm ' +
    'text-neutral-900 placeholder:text-neutral-500 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget
    const data = {
      nama_pengisi: form.nama.value,
      status_pengisi: form.status.value,
      whatsapp: form.whatsapp.value,
      pesan: form.pesan.value,
      tanggal_diminta: form.tanggal.value
    }

    await supabase.from('requests').insert(data)
    alert('Permintaan berhasil dikirim 🙏')
    form.reset()
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-2xl font-semibold text-neutral-800">
          Satu Pintu GKI Batu
        </h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Silakan isi formulir permintaan dengan lengkap
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Nama</label>
            <input
              name="nama"
              required
              placeholder="Nama lengkap"
              className={inputClass}
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Status</label>
            <select
              name="status"
              required
              className={inputClass}
            >
              <option value="">Pilih status</option>
              <option>Komisi Dewasa</option>
              <option>Komisi Pemuda Remaja</option>
              <option>Komisi Muger</option>
              <option>Komisi Anak</option>
              <option>Jemaat Umum</option>
              <option>Majelis Jemaat</option>
              <option>Simpatisan</option>
            </select>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">
              Nomor WhatsApp
            </label>
            <input
              name="whatsapp"
              required
              placeholder="08xxxxxxxxxx"
              className={inputClass}
            />
          </div>

          {/* Pesan */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">
              Isi Permintaan
            </label>
            <textarea
              name="pesan"
              required
              rows={4}
              placeholder="Tuliskan permintaan atau kebutuhan Anda"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Tanggal */}
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">
              Tanggal yang Diminta
            </label>
            <input
              type="date"
              name="tanggal"
              required
              className={inputClass}
            />
          </div>

          {/* Button */}
          <button
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-neutral-900 text-white py-2.5 text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-60"
          >
            {loading ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </form>
      </div>
    </main>
  )
}