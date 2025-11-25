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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Tous les tournois</h1>
          <p className="text-gray-600">
            Découvrez tous les tournois disponibles et inscrivez votre équipe
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-8 flex gap-4">
          <a
            href="/tournaments"
            className={`px-4 py-2 rounded-lg ${
              !searchParams.status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tous
          </a>
          <a
            href="/tournaments?status=registration_open"
            className={`px-4 py-2 rounded-lg ${
              searchParams.status === 'registration_open'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Inscriptions ouvertes
          </a>
          <a
            href="/tournaments?status=ongoing"
            className={`px-4 py-2 rounded-lg ${
              searchParams.status === 'ongoing'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            En cours
          </a>
          <a
            href="/tournaments?status=completed"
            className={`px-4 py-2 rounded-lg ${
              searchParams.status === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Terminés
          </a>
        </div>

        {/* Liste des tournois */}
        {filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun tournoi trouvé</p>
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
