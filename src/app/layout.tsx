import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Barbarians Portfolio',
  description: 'Profesyonel Portföy Yönetimi',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
