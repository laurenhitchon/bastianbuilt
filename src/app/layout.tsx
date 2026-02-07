import '@/app/globals.css'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import type React from 'react'

const _inter = Inter({ subsets: ['latin'] })
const _ibmMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: 'Bastian Built - Industrial Design Portfolio',
  description:
    'Accomplished industrial designer specializing in Fusion 360 and 3D printing technology',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`font-sans antialiased ${_inter.className} ${_ibmMono.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
