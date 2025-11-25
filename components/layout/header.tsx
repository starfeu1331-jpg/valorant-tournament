'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { NotificationsBadge } from './notifications-badge'
import { MessagesBadge } from './messages-badge'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="w-full max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4">
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
                <Link
                  href="/contact-staff"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  📞 Support
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
              {/* Icône Messages */}
              <Link href="/messages" className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-gray-700 hover:text-primary-600 transition-colors cursor-pointer"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                <MessagesBadge />
              </Link>

              {/* Avatar avec dropdown notifications */}
              <NotificationsBadge session={session} />

              <div className="hidden sm:flex sm:flex-col sm:justify-center">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {session.user.role === 'ADMIN' ? '👑 Admin' : 
                   session.user.role === 'STAFF' ? '⭐ Staff' : 
                   '🎮 Joueur'}
                </p>
              </div>

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
