import Link from 'next/link'
import { getTournaments } from '@/lib/actions/tournaments'
import { TournamentCard } from '@/components/tournaments/tournament-card'

export default async function HomePage() {
  const tournaments = await getTournaments()

  const registrationOpenTournaments = tournaments.filter((t: any) => t.status === 'REGISTRATION_OPEN')
  const upcomingTournaments = tournaments.filter((t: any) => t.status === 'UPCOMING')
  const ongoingTournaments = tournaments.filter((t: any) => t.status === 'ONGOING')

  return (
    <div className="min-h-screen -mt-20 md:-mt-28">
      {/* Hero Section Spectaculaire */}
      <section className="relative min-h-screen overflow-hidden pb-16 md:pb-32">
        {/* Background avec montagne */}
        <div className="absolute inset-0">
          <img 
            src="/graphisme/[1] Chartes 2025/[4] Images d'ambiance/fond_of.jpg"
            alt="Background"
            className="w-full h-full object-cover scale-110"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>
        
        {/* Effet montagne premier plan - desktop only */}
        <div 
          className="hidden md:block absolute bottom-0 left-0 right-0 h-2/3 bg-cover bg-bottom opacity-20 pointer-events-none"
          style={{
            backgroundImage: "url('/graphisme/[1] Chartes 2025/[4] Images d\\'ambiance/effet_solo.png')",
            mixBlendMode: 'screen',
          }}
        />
        
        {/* Particules flottantes - desktop only */}
        <div className="hidden md:block absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-float" style={{animationDelay: '0s'}} />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-float" style={{animationDelay: '1s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-red-300 rounded-full animate-float" style={{animationDelay: '2s'}} />
          <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-red-500 rounded-full animate-float" style={{animationDelay: '1.5s'}} />
        </div>
        
        {/* Contenu Hero */}
        <div className="relative z-10 container mx-auto px-4 md:px-6 min-h-screen flex flex-col justify-center items-center text-center pt-16 md:pt-32">
          <div className="animate-fade-in-up space-y-6 md:space-y-10">
            {/* Logo + Titre */}
            <div className="flex flex-col items-center gap-6 md:gap-10">
              <img 
                src="/images/logos/logo.png" 
                alt="EVY Logo"
                className="h-16 md:h-24 lg:h-32 w-auto animate-float drop-shadow-2xl"
              />
              <h1 className="text-4xl sm:text-5xl md:text-8xl lg:text-9xl font-display font-black tracking-wide leading-tight md:leading-relaxed">
                <span className="text-gradient block mb-2 md:mb-4">EVY's</span>
                <span className="block text-white">VALORANT</span>
                <span className="block text-white">TOURNAMENT</span>
              </h1>
            </div>
            
            <p className="text-base md:text-3xl text-white/90 font-bold max-w-4xl mx-auto px-4">
              La plateforme officielle de l'association EVY
            </p>
            
            <p className="text-sm md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)] px-4">
              Rejoins des milliers de joueurs, crée ton équipe et prouve ta valeur dans les compétitions les plus intenses
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-8 md:mb-12 w-full px-4">
              <Link href="/tournaments" className="w-full sm:w-auto flex justify-center">
                <button className="group relative px-6 md:px-10 py-3 md:py-5 bg-white text-black rounded-2xl md:rounded-3xl font-bold text-sm md:text-lg overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-2xl shadow-xl w-full sm:w-auto">
                  <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                    🏆 <span>Voir les tournois</span>
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{background: 'linear-gradient(135deg, #fe2860 0%, #ff6388 100%)'}} />
                  <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 md:gap-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-black">
                    🏆 <span>Voir les tournois</span>
                  </span>
                </button>
              </Link>
              
              <Link href="/auth/signin" className="w-full sm:w-auto flex justify-center">
                <button className="px-6 md:px-10 py-3 md:py-5 bg-white/5 backdrop-blur-xl text-white border-2 border-white/30 rounded-2xl md:rounded-3xl font-bold text-sm md:text-lg transition-all duration-500 hover:bg-white/10 hover:scale-110 hover:border-red-500 shadow-xl flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto">
                  ⚡ <span>Commencer maintenant</span>
                </button>
              </Link>
            </div>
            
            {/* Stats animées */}
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-12 w-full px-4">
              <div className="glass-card px-4 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl card-hover">
                <div className="text-2xl md:text-4xl font-display font-black text-gradient text-center">{tournaments.length}+</div>
                <div className="text-xs md:text-sm text-white/80 font-medium mt-1 text-center">Tournois</div>
              </div>
              <div className="glass-card px-4 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl card-hover">
                <div className="text-2xl md:text-4xl font-display font-black text-gradient text-center">{registrationOpenTournaments.length}</div>
                <div className="text-xs md:text-sm text-white/80 font-medium mt-1 text-center whitespace-nowrap">Inscriptions ouvertes</div>
              </div>
              <div className="glass-card px-4 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl card-hover">
                <div className="text-2xl md:text-4xl font-display font-black text-gradient text-center">{ongoingTournaments.length}</div>
                <div className="text-xs md:text-sm text-white/80 font-medium mt-1 text-center">En cours</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <svg className="w-6 h-6 md:w-8 md:h-8 text-white/70" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Registration Open Tournaments */}
      {registrationOpenTournaments.length > 0 && (
        <section className="py-16 md:py-32 relative overflow-hidden">
          {/* Formes décoratives */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-red-500 rounded-full filter blur-3xl opacity-10 animate-float" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-red-400 rounded-full filter blur-3xl opacity-10 animate-float" style={{animationDelay: '2s'}} />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-8 md:mb-16 space-y-4 md:space-y-6">
              <div className="inline-block">
                <span className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-black text-xs md:text-sm tracking-wider animate-bounce shadow-lg">
                  🔥 INSCRIPTIONS OUVERTES
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-display font-black text-white px-4">
                Rejoins <span className="text-gradient">maintenant</span>
              </h2>
              <p className="text-white/70 text-sm md:text-xl max-w-2xl mx-auto font-medium px-4">
                Les inscriptions sont ouvertes ! Ne rate pas ta chance de participer aux meilleurs tournois
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {registrationOpenTournaments.map((tournament: any) => (
                <div key={tournament.id} className="card-hover">
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ongoing Tournaments */}
      {ongoingTournaments.length > 0 && (
        <section className="py-16 md:py-32 relative overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-red-500 rounded-full filter blur-3xl opacity-10 animate-float" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-red-400 rounded-full filter blur-3xl opacity-10 animate-float" style={{animationDelay: '1.5s'}} />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center mb-8 md:mb-16 space-y-4 md:space-y-6">
              <div className="inline-block">
                <span className="px-4 md:px-8 py-2 md:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-black text-xs md:text-sm tracking-wider shadow-lg">
                  ⚡ EN DIRECT MAINTENANT
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-black text-white">
                Tournois <span className="text-gradient">en cours</span>
              </h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto font-medium">
                Suis les compétitions en temps réel et découvre les meilleurs joueurs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ongoingTournaments.map((tournament: any) => (
                <div key={tournament.id} className="card-hover">
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <section className="py-32 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-6">
              <h2 className="text-5xl md:text-7xl font-display font-black text-white">
                À <span className="text-gradient">venir</span>
              </h2>
              <p className="text-white/70 text-xl max-w-2xl mx-auto font-medium">
                Prépare-toi pour les prochaines compétitions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingTournaments.map((tournament: any) => (
                <div key={tournament.id} className="card-hover">
                  <TournamentCard tournament={tournament} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Final Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/graphisme/[1] Chartes 2025/[4] Images d'ambiance/evy-fond.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/90" />
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-5xl md:text-7xl font-display font-black text-white">
              Prêt à <span className="text-gradient">dominer</span> ?
            </h2>
            <p className="text-2xl text-white/80 max-w-3xl mx-auto font-medium">
              Crée ton équipe, inscris-toi aux tournois et montre au monde ce dont tu es capable
            </p>
            <div className="pt-8">
              <Link href="/tournaments">
                <button className="btn-primary text-xl px-12 py-6 shadow-2xl">
                  🚀 Découvrir les tournois
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
