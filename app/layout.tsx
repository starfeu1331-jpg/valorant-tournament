import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/header'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  weight: ['600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'EVY Tournament - Plateforme E-Sport',
  description: 'Plateforme officielle de gestion de tournois e-sport EVY pour Valorant et autres jeux compétitifs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="light">
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <AuthProvider>
          <Header />
          <main className="min-h-screen pt-28 relative">
            {/* Background image globale pour toutes les pages */}
            <div className="fixed inset-0 -z-10">
              <img 
                src="/images/backgrounds/evy-fond.jpg"
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
            </div>
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
