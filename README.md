# Sistem Satu Pintu GKI Batu

Sistem manajemen permintaan jemaat untuk Tata Usaha Gereja.

## Fitur Utama

### 1. Form Pengisian (Public - `/`)
- Tidak perlu login
- Mobile-friendly
- Field: Nama, Status Jemaat, Kontak WA, Pesan, Tanggal Kebutuhan
- Auto-capture tanggal permintaan

### 2. Dashboard Majelis (`/dashboard/majelis`)
- Login required (hardcoded account)
- Review permintaan jemaat
- Approve → ke Admin (kirim WA notif "sedang dikerjakan")
- Reject → Delete & kirim WA notif "ditolak"
- Tambah catatan untuk Admin

### 3. Dashboard Admin (`/dashboard/admin`)
- Login required (hardcoded account)
- Lihat permintaan yang di-approve Majelis
- Checklist jika selesai
- Auto kirim WA notif "selesai" ke pengisi

### 4. Pembukuan Bulanan
- Rekap per bulan
- Export laporan

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Notifications**: WhatsApp API Integration

## Database Schema

### Table: `permintaan`
- id (uuid, primary key)
- nama (text)
- status_jemaat (text) - komisi dewasa/pemuda/muger/anak/jemaat umum/majelis/simpatisan
- kontak_wa (text)
- pesan (text)
- tanggal_kebutuhan (date)
- tanggal_permintaan (timestamp)
- status (text) - pending/disetujui/sedang_dikerjakan/selesai/ditolak
- catatan_majelis (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### Table: `profiles` (extends Supabase auth.users)
- id (uuid, foreign key to auth.users)
- email (text)
- role (text) - majelis/admin
- nama (text)

## Hardcoded Accounts (untuk inject ke Supabase)

```sql
-- Majelis Account
email: majelis@gkibatu.org
password: Majelis@2024

-- Admin Account  
email: admin@gkibatu.org
password: Admin@2024
```

## Setup Instructions

1. Clone repository
2. Install dependencies: `npm install`
3. Setup Supabase project
4. Copy `.env.example` to `.env.local`
5. Run migrations
6. Inject hardcoded accounts
7. Run development: `npm run dev`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_API_URL=your_whatsapp_api_url
```

## Deployment

Deploy ke Vercel dengan domain: satupintugkibatu.vercel.app

## WhatsApp Notification Messages

- **Disetujui Majelis**: "Halo {nama}, permintaan Anda sedang dikerjakan oleh admin. Terima kasih."
- **Ditolak**: "Halo {nama}, mohon maaf permintaan Anda tidak dapat diproses. Silakan hubungi TU untuk informasi lebih lanjut."
- **Selesai**: "Halo {nama}, permintaan Anda telah selesai dikerjakan. Terima kasih."