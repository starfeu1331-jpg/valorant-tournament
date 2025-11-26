import { getTournaments } from '@/lib/actions/tournaments'
import { TournamentCard } from '@/components/tournaments/tournament-card'

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const tournaments = await getTournaments()
  
  const filteredTournaments = searchParams.status
    ? tournaments.filter(t => t.status.toLowerCase() === searchParams.status?.toLowerCase())
    : tournaments

  return (
    <div className="min-h-screen py-12">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card rounded-4xl p-8 md:p-12 border border-white/20 mb-8">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-4">Tous les tournois</h1>
            <p className="text-white/80 text-lg">
              Découvrez tous les tournois disponibles et inscrivez votre équipe
            </p>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            <a
              href="/tournaments"
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                !searchParams.status
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Tous
            </a>
            <a
              href="/tournaments?status=registration_open"
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                searchParams.status === 'registration_open'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Inscriptions ouvertes
            </a>
            <a
              href="/tournaments?status=ongoing"
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                searchParams.status === 'ongoing'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              En cours
            </a>
            <a
              href="/tournaments?status=completed"
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                searchParams.status === 'completed'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Terminés
            </a>
          </div>
        </div>

        {/* Liste des tournois */}
        {filteredTournaments.length === 0 ? (
          <div className="glass-card rounded-4xl p-12 border border-white/20 text-center">
            <p className="text-white/70 text-lg">Aucun tournoi trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
