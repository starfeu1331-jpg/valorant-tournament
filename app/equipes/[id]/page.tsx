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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-bold">
                    {team.tag}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    🎮 <strong>{team.game}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    👤 <strong>{team.owner.username}</strong> (Propriétaire)
                  </span>
                </div>
                {team.description && (
                  <p className="text-gray-700 mt-4">{team.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link href="/equipes">
                  <Button variant="outline">Retour</Button>
                </Link>
                {isStaff && (
                  <Link href={`/staff/equipes/${team.id}`}>
                    <Button variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                      ⚙️ Gérer
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Roster */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Roster ({team.players.length})
            </h2>
            <div className="space-y-3">
              {team.players.map((player: any) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
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
                        className="font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {player.user.username}
                      </Link>
                      {player.user.riotId && (
                        <p className="text-sm text-gray-600">{player.user.riotId}</p>
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
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {player.role === 'CAPTAIN' ? '👑 Capitaine' : 'Joueur'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tournois */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Tournois ({team.tournamentTeams.length})
            </h2>
            {team.tournamentTeams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune inscription à un tournoi
              </div>
            ) : (
              <div className="space-y-3">
                {team.tournamentTeams.map((tt: any) => (
                  <Link
                    key={tt.id}
                    href={`/tournaments/${tt.tournament.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{tt.tournament.name}</h3>
                        <p className="text-sm text-gray-600">
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
