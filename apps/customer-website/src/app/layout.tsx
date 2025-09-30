import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import '../styles/filter-animations.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'BlackRent.sk - Prenájom áut',
  description: 'Autá pre každodennú potrebu, aj nezabudnuteľný zážitok.',
  keywords: 'prenájom áut, rental cars, BlackRent, Slovensko',
  authors: [{ name: 'BlackRent Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk" className={poppins.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}