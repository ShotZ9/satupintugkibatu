'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [jenis, setJenis] = useState<'warta' | 'saran'>('warta')

  const inputClass =
    'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm ' +
    'text-neutral-900 placeholder:text-neutral-500 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = e.currentTarget

    const data: any = {
      nama_pengisi: form.nama.value,
      status_pengisi: form.status.value,
      whatsapp: form.whatsapp.value,
      pesan: form.pesan.value,
      jenis: jenis,
      status: 'menunggu_majelis'
    }

    if (jenis === 'warta') {
      data.tanggal_diminta = form.tanggal.value
    }

    await supabase.from('requests').insert(data)

    alert('Permintaan berhasil dikirim 🙏')
    form.reset()
    setJenis('warta')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-2xl font-bold text-neutral-800">
          Satu Pintu GKI Batu
        </h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Silakan isi formulir permintaan dengan lengkap
        </p>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Jenis Permintaan</label>

          <div className="relative flex rounded-lg border border-neutral-300 bg-white p-1">

            {/* Animated Background */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              className="absolute top-1 bottom-1 w-1/2 rounded-full bg-neutral-900"
              style={{
                left: jenis === 'warta' ? '4px' : 'calc(50% - 4px)',
              }}
            />

            <button
              type="button"
              onClick={() => setJenis('warta')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${jenis === 'warta'
                ? 'text-white'
                : 'text-neutral-600'
                }`}
            >
              Warta Jemaat
            </button>

            <button
              type="button"
              onClick={() => setJenis('saran')}
              className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${jenis === 'saran'
                ? 'text-white'
                : 'text-neutral-600'
                }`}
            >
              Kotak Saran
            </button>

          </div>
        </div>
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
              <option>Majelis Jemaat</option>
              <option>Jemaat Umum</option>
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
          <AnimatePresence>
            {jenis === 'warta' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-1"
              >
                <label className="text-sm text-neutral-600">
                  Tanggal? yang Diminta
                </label>
                <input
                  type="date"
                  name="tanggal"
                  required
                  className={inputClass}
                />
              </motion.div>
            )}
          </AnimatePresence>

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