'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { NotificationsBadge } from './notifications-badge'
import { MessagesBadge } from './messages-badge'
import { useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-3 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-[98%] max-w-[1600px]">
      {/* Grosse bulle floue en arrière-plan du header */}
      <div className="absolute -inset-20 pointer-events-none hidden md:block">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-primary-500/20 via-purple-500/20 to-pink-500/20 rounded-full filter blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl" />
      </div>
      
      <div className="relative glass-card rounded-2xl md:rounded-3xl border border-white/20 shadow-2xl">
        <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 md:space-x-3 group">
          <img 
            src="/images/logos/logo.png" 
            alt="EVY Logo" 
            className="h-8 md:h-12 w-auto transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-lg md:text-2xl font-display font-bold text-gradient">
              EVY
            </span>
            <span className="text-[10px] md:text-xs text-white/70 font-medium">Association</span>
          </div>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
            Accueil
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/tournaments" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
            Tournois
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/equipes" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
            Équipes
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link href="/joueurs" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
            Joueurs
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
          </Link>
          {session ? (
            <>
              <Link href="/teams" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
                Mes équipes
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/invitations" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
                Invitations
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/contact-staff" className="text-sm font-semibold text-white hover:text-primary-500 transition-all relative group">
                📞 Support
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-gaming group-hover:w-full transition-all duration-300"></span>
              </Link>
            </>
          ) : null}
          {session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN' ? (
            <Link href="/staff" className="text-sm font-semibold bg-gradient-gaming text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
              ⚡ Dashboard Staff
            </Link>
          ) : null}
        </nav>

        {/* Actions Desktop & Mobile */}
        <div className="flex items-center gap-2 md:gap-5">
          {status === 'loading' ? (
            <div className="h-8 md:h-10 w-20 md:w-32 animate-pulse rounded-lg bg-gray-200" />
          ) : session?.user ? (
            <>
              {/* Messages - visible sur mobile */}
              <Link href="/messages" className="relative group">
                <div className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:text-white transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <MessagesBadge />
                </div>
              </Link>

              {/* Notifications */}
              <NotificationsBadge session={session} />

              {/* Info user - desktop only */}
              <div className="hidden lg:flex lg:flex-col lg:justify-center border-l pl-4 border-white/20">
                <p className="text-sm font-bold text-white leading-tight">{session.user.name}</p>
                <p className="text-xs font-medium leading-tight">
                  {session.user.role === 'ADMIN' ? (
                    <span className="text-primary-400">👑 Administrateur</span>
                  ) : session.user.role === 'STAFF' ? (
                    <span className="text-primary-400">⭐ Staff</span>
                  ) : (
                    <span className="text-white/70">🎮 Joueur</span>
                  )}
                </p>
              </div>

              {/* Bouton déconnexion - desktop only */}
              <button onClick={() => signOut({ callbackUrl: '/' })} className="hidden md:flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-red-400 transition-all px-4 py-2 rounded-lg hover:bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Déconnexion
              </button>

              {/* Bouton menu mobile */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="inline-flex items-center gap-1.5 md:gap-2 justify-center rounded-lg text-xs md:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-gradient-gaming text-white hover:shadow-lg hover:scale-105 h-9 md:h-11 px-4 md:px-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <span className="hidden sm:inline">Se connecter</span>
                <span className="sm:hidden">Connexion</span>
              </Link>
              {/* Bouton menu mobile pour non connectés */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 glass-card rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          <nav className="flex flex-col py-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
              🏠 Accueil
            </Link>
            <Link href="/tournaments" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
              🏆 Tournois
            </Link>
            <Link href="/equipes" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
              👥 Équipes
            </Link>
            <Link href="/joueurs" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
              🎮 Joueurs
            </Link>
            {session ? (
              <>
                <div className="h-px bg-white/10 my-2" />
                <Link href="/teams" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  ⚔️ Mes équipes
                </Link>
                <Link href="/invitations" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  📨 Invitations
                </Link>
                <Link href="/contact-staff" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all">
                  📞 Support
                </Link>
                {(session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN') && (
                  <Link href="/staff" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm font-semibold bg-gradient-gaming text-white hover:opacity-90 transition-all">
                    ⚡ Dashboard Staff
                  </Link>
                )}
                <div className="h-px bg-white/10 my-2" />
                <div className="px-4 py-2 text-xs text-white/70">
                  <p className="font-bold text-white">{session.user.name}</p>
                  <p>
                    {session.user.role === 'ADMIN' ? '👑 Administrateur' : 
                     session.user.role === 'STAFF' ? '⭐ Staff' : '🎮 Joueur'}
                  </p>
                </div>
                <button onClick={() => { signOut({ callbackUrl: '/' }); setMobileMenuOpen(false); }} className="mx-4 my-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Déconnexion
                </button>
              </>
            ) : null}
          </nav>
        </div>
      )}
      </div>
    </header>
  )
}
