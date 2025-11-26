import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'EVY Tournament - Plateforme E-Sport',
  description: 'Plateforme officielle de gestion de tournois e-sport EVY pour Valorant et autres jeux compétitifs',
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Header />
      <main className="min-h-screen pt-20 md:pt-28 relative">
        {/* Background image globale pour toutes les pages */}
        <div className="fixed inset-0 -z-10">
          <img 
            src="/images/backgrounds/evy-fond.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />
        </div>
        {children}
      </main>
      <Toaster />
    </AuthProvider>
  )
}
