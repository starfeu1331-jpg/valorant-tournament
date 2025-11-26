'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'Il y a un problème avec la configuration du serveur.',
    AccessDenied: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
    Verification: 'Le lien de vérification a expiré ou a déjà été utilisé.',
    Default: 'Une erreur s\'est produite lors de l\'authentification.',
    Callback: 'Erreur lors du traitement de l\'authentification Discord.',
    OAuthCallback: 'Erreur lors de la connexion avec Discord.',
  }

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Decorative bubbles */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="max-w-md w-full space-y-8 p-8 md:p-12 glass-card rounded-4xl border border-white/20 relative z-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500/30">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-display font-black text-white">
            Erreur d'authentification
          </h2>
          <p className="text-base text-white/70">{message}</p>
          {error && (
            <p className="text-sm text-white/50 font-mono bg-white/5 p-3 rounded-xl border border-white/10">
              Code: {error}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <Link href="/auth/signin">
            <Button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold py-6 rounded-2xl transition-all duration-300 hover:scale-105" size="lg">
              Réessayer
            </Button>
          </Link>

          <Link href="/" className="block text-center">
            <Button className="w-full bg-white/5 border border-white/20 text-white hover:bg-white/10 font-semibold py-6 rounded-2xl transition-all duration-300" size="lg">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">Chargement...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
