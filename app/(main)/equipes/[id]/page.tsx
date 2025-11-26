import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PublicTeamDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      players: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      tournamentTeams: {
        include: {
          tournament: true,
        },
        orderBy: {
          registeredAt: 'desc',
        },
      },
    },
  })

  if (!team) {
    notFound()
  }

  const isStaff = session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{team.name}</h1>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full font-bold text-sm">
                    {team.tag}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-white/70">
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    🎮 <strong>{team.game}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    👤 <strong className="break-all">{team.owner.username}</strong> (Propriétaire)
                  </span>
                </div>
                {team.description && (
                  <p className="text-white/70 mt-4 break-words">{team.description}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                <Link href="/equipes" className="flex-1 md:flex-initial">
                  <Button variant="outline" className="w-full md:w-auto">
                    <span className="md:hidden">←</span>
                    <span className="hidden md:inline">Retour</span>
                  </Button>
                </Link>
                {isStaff && (
                  <Link href={`/staff/equipes/${team.id}`} className="flex-1 md:flex-initial">
                    <Button variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 w-full md:w-auto">
                      <span className="md:hidden">⚙️</span>
                      <span className="hidden md:inline">⚙️ Gérer</span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Roster */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Roster ({team.players.length})
            </h2>
            <div className="space-y-3">
              {team.players.map((player: any) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {player.user.image && (
                      <img
                        src={player.user.image}
                        alt={player.user.username}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <Link 
                        href={`/joueurs/${player.user.id}`}
                        className="font-medium text-red-400 hover:text-red-300 hover:underline"
                      >
                        {player.user.username}
                      </Link>
                      {player.user.riotId && (
                        <p className="text-sm text-white/50">{player.user.riotId}</p>
                      )}
                      {player.user.valorantRank && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded ml-2">
                          {player.user.valorantRank}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      player.role === 'CAPTAIN'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-white/10 text-white/70 border border-white/20'
                    }`}
                  >
                    {player.role === 'CAPTAIN' ? '👑 Capitaine' : 'Joueur'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tournois */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Tournois ({team.tournamentTeams.length})
            </h2>
            {team.tournamentTeams.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                Aucune inscription à un tournoi
              </div>
            ) : (
              <div className="space-y-3">
                {team.tournamentTeams.map((tt: any) => (
                  <Link
                    key={tt.id}
                    href={`/tournaments/${tt.tournament.id}`}
                    className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:border-red-500/50 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white">{tt.tournament.name}</h3>
                        <p className="text-sm text-white/50">
                          {new Date(tt.tournament.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tt.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : tt.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tt.status === 'ACCEPTED'
                          ? '✓ Validée'
                          : tt.status === 'PENDING'
                          ? '⏳ En attente'
                          : '✗ Refusée'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
