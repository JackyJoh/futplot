import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'FutPlot - Football Analytics',
  description: 'Advanced football player analytics and visualization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-emerald-400">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
