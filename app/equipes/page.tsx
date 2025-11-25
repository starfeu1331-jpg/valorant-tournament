import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PublicTeamsPage({
  searchParams,
}: {
  searchParams: { search?: string; game?: string }
}) {
  const search = searchParams.search || ''
  const game = searchParams.game || ''

  const teams = await prisma.team.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { tag: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        game ? { game } : {},
      ],
    },
    include: {
      owner: true,
      _count: {
        select: {
          players: true,
          tournamentTeams: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const games = ['Valorant', 'League of Legends', 'CS2', 'Fortnite', 'Rocket League', 'Overwatch 2']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Toutes les équipes</h1>
          <p className="text-gray-600 mt-1">Parcourez toutes les équipes inscrites sur la plateforme</p>
        </div>

        {/* Filtres */}
        <form method="GET" className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-900 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Nom ou tag d'équipe..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="game" className="block text-sm font-medium text-gray-900 mb-2">
                Jeu
              </label>
              <select
                id="game"
                name="game"
                defaultValue={game}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les jeux</option>
                {games.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                Rechercher
              </Button>
              <Link href="/equipes" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Réinitialiser
                </Button>
              </Link>
            </div>
          </div>
        </form>

        {/* Résultats */}
        <div className="mb-4 text-sm text-gray-600">
          {teams.length} équipe{teams.length > 1 ? 's' : ''} trouvée{teams.length > 1 ? 's' : ''}
        </div>

        {teams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune équipe trouvée</h2>
            <p className="text-gray-600">Essayez avec d'autres critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: any) => (
              <Link
                key={team.id}
                href={`/equipes/${team.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                      <p className="text-primary-600 font-medium">{team.tag}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      🎮 {team.game}
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{team.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                    <span>👥 {team._count.players} joueurs</span>
                    <span>🏆 {team._count.tournamentTeams} tournois</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
