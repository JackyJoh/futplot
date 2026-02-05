import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'FutPlot - Football Analytics',
  description: 'Advanced football player analytics and visualization',
  icons: {
    icon: '/futplot.jpg',
    apple: '/futplot.jpg',
  },
  openGraph: {
    title: 'FutPlot - Football Analytics',
    description: 'Advanced football player analytics and visualization',
    images: ['/futplot.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutPlot - Football Analytics',
    description: 'Advanced football player analytics and visualization',
    images: ['/futplot.jpg'],
  },
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
