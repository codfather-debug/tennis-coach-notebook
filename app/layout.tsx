import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tennis Coach Notebook',
  description: 'Real-time match tracking for tennis coaches',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Coach Notebook',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
