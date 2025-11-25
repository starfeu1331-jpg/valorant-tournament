'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo et navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-400" />
            <span className="text-xl font-bold text-gray-900">
              E-Sport Tournaments
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/tournaments"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              Tournois
            </Link>
            <Link
              href="/equipes"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              Équipes
            </Link>
            <Link
              href="/joueurs"
              className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
            >
              Joueurs
            </Link>
            {session ? (
              <>
                <Link
                  href="/teams"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Mes équipes
                </Link>
                <Link
                  href="/invitations"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors relative"
                >
                  Invitations
                </Link>
              </>
            ) : null}
            {session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN' ? (
              <Link
                href="/staff"
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Dashboard Staff
              </Link>
            ) : null}
          </nav>
        </div>

        {/* Profil utilisateur */}
        <div className="flex items-center gap-4">
          {status === 'loading' ? (
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
          ) : session?.user ? (
            <div className="flex items-center gap-3">
              {/* Avatar et nom */}
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-primary-100"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.user.role === 'ADMIN' ? '👑 Admin' : 
                     session.user.role === 'STAFF' ? '⭐ Staff' : 
                     '🎮 Joueur'}
                  </p>
                </div>
              </Link>

              {/* Bouton déconnexion */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 bg-primary-600 text-white hover:bg-primary-700 h-9 px-4"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
