'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)

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
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Satu Pintu GKI Batu
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="nama" placeholder="Nama" required className="input" />
        <select name="status" required className="input">
          <option value="">Status</option>
          <option>Komisi Dewasa</option>
          <option>Komisi Pemuda Remaja</option>
          <option>Komisi Muger</option>
          <option>Komisi Anak</option>
          <option>Jemaat Umum</option>
          <option>Majelis Jemaat</option>
          <option>Simpatisan</option>
        </select>
        <input name="whatsapp" placeholder="No WhatsApp" required className="input" />
        <textarea name="pesan" placeholder="Isi Permintaan" required className="input" />
        <input type="date" name="tanggal" required className="input" />

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? 'Mengirim...' : 'Kirim'}
        </button>
      </form>
    </main>
  )
}