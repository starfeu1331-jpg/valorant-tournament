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
  }

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Erreur d'authentification
          </h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div className="mt-8">
          <Link href="/auth/signin">
            <Button className="w-full" size="lg">
              Réessayer
            </Button>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary-600 hover:text-primary-700">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Chargement...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
