import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  metadataBase: new URL('https://futplot.com'),
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
      <body className="bg-[#1a1f3a] text-white font-body antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
