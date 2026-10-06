import type { Metadata } from 'next'
import './globals.css'
import { DataProvider } from '@/components/DataContext'

export const metadata: Metadata = {
  title: 'Vice Verse Admin',
  description: 'Central command center for Vice Verse 1.0 2026',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  )
}
