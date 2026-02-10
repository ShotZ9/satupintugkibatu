import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap'
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: 'Satu Pintu GKI Batu',
    template: '%s | Satu Pintu GKI Batu'
  },
  description:
    'Sistem satu pintu GKI Batu untuk pengelolaan permintaan, pelayanan, dan administrasi jemaat secara terpusat.',
  metadataBase: new URL('https://satupintugkibatu.vercel.app'),
  icons: {
    icon: '/favicon.ico'
  },
  openGraph: {
    title: 'Satu Pintu GKI Batu',
    description:
      'Sistem satu pintu GKI Batu untuk pengelolaan permintaan dan pelayanan jemaat.',
    url: 'https://satupintugkibatu.vercel.app',
    siteName: 'Satu Pintu GKI Batu',
    locale: 'id_ID',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          bg-gray-50
          text-gray-900
        `}
      >
        {children}
      </body>
    </html>
  )
}