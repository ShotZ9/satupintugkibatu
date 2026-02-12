import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import SessionWatcher from './components/SessionWatcher'
import Image from "next/image"

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
          min-h-screen
          flex
          flex-col
        `}
      >
        <SessionWatcher />

        {/* CONTENT */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* FOOTER - GLOBAL */}
        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-8 text-sm text-gray-600 text-center md:text-left">

              {/* Left */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3">

                <Image
                  src="/vm.png"
                  alt="Visi Misi GKI Batu"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />

                <div className="text-center md:text-left">
                  <h3 className="font-semibold text-gray-800">
                    Satu Pintu GKI Batu
                  </h3>

                  <p className="mt-1 text-gray-600">
                    Sistem pengelolaan pelayanan & administrasi jemaat terpusat.
                  </p>

                  {/* Copyright Desktop */}
                  <div className="hidden md:block mt-1 text-gray-500 text-sm">
                    © {new Date().getFullYear()} GKI Batu. All rights reserved.
                  </div>
                </div>

              </div>

              {/* Center - Mobile Only */}
              <div className="text-gray-500 md:hidden">
                © {new Date().getFullYear()} GKI Batu.
                <br />
                <span>All rights reserved.</span>
              </div>

              {/* Right */}
              <div className="flex flex-col items-center md:items-end text-gray-500">
                <p>Versi 1.0.0</p>
                <p className="mt-1">
                  Dikembangkan oleh Tim IT GKI Batu
                </p>
              </div>

            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}