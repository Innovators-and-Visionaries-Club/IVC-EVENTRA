import type { Metadata } from 'next'
import './globals.css'
import { DataProvider } from '@/components/DataContext'
import Sidebar from '@/components/Sidebar'

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
          <div className="flex flex-col md:flex-row min-h-screen bg-[#050508]">
            <Sidebar />
            <main className="flex-1 p-5 md:p-10" style={{
              background: 'radial-gradient(circle at top right, rgba(255, 0, 127, 0.05), transparent 400px), radial-gradient(circle at bottom left, rgba(0, 240, 255, 0.03), transparent 400px)'
            }}>
              {children}
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  )
}
