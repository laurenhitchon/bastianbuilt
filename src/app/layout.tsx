import '@/app/globals.css'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { DM_Sans, Space_Mono } from 'next/font/google'
import type React from 'react'

const _dmSans = DM_Sans({ subsets: ['latin'] })
const _spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: '400',
})

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
      <body className={`font-sans antialiased ${_dmSans.className} ${_spaceMono.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
