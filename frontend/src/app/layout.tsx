import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import { AppHeader } from '../components/AppHeader'
import '../styles/globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
})

export const metadata: Metadata = {
  title: 'Omnigen',
  description: 'Geração automatizada de vídeos com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={ibmPlexSans.variable}>
      <body className="bg-white text-near-black font-ui antialiased min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
