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
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card rounded-4xl p-8 md:p-12 border border-white/20 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-3">Toutes les équipes</h1>
          <p className="text-white/80 text-lg">Parcourez toutes les équipes inscrites sur la plateforme</p>
        </div>

        {/* Filtres */}
        <form method="GET" className="glass-card rounded-4xl border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-bold text-white mb-2">
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Nom ou tag d'équipe..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 backdrop-blur-sm"
              />
            </div>
            <div>
              <label htmlFor="game" className="block text-sm font-bold text-white mb-2">
                Jeu
              </label>
              <select
                id="game"
                name="game"
                defaultValue={game}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 backdrop-blur-sm"
              >
                <option value="" className="bg-gray-900">Tous les jeux</option>
                {games.map((g) => (
                  <option key={g} value={g} className="bg-gray-900">
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
        <div className="mb-4 text-sm font-medium text-white/70">
          {teams.length} équipe{teams.length > 1 ? 's' : ''} trouvée{teams.length > 1 ? 's' : ''}
        </div>

        {teams.length === 0 ? (
          <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-display font-black text-white mb-2">Aucune équipe trouvée</h2>
            <p className="text-white/70">Essayez avec d'autres critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: any) => (
              <Link
                key={team.id}
                href={`/equipes/${team.id}`}
                className="glass-card rounded-3xl border border-white/20 hover:border-primary-500/50 transition-all card-hover group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-gradient transition-all">{team.name}</h3>
                      <p className="text-primary-400 font-bold">{team.tag}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                      🎮 {team.game}
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-sm text-white/80 mb-4 line-clamp-2">{team.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-white/70 pt-4 border-t border-white/10">
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
