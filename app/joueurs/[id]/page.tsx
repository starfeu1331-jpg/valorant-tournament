import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PublicPlayerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      ownedTeams: {
        include: {
          _count: {
            select: {
              players: true,
              tournamentTeams: true,
            },
          },
        },
      },
      teamPlayers: {
        include: {
          team: {
            include: {
              _count: {
                select: {
                  players: true,
                  tournamentTeams: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const isStaff = session?.user?.role === 'STAFF' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profil */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.username}
                    className="w-24 h-24 rounded-full"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'STAFF'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.role === 'ADMIN' ? '👑 Admin' : user.role === 'STAFF' ? '⚙️ Staff' : '🎮 Joueur'}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/joueurs">
                  <Button variant="outline">Retour</Button>
                </Link>
                {isStaff && (
                  <Link href={`/staff/joueurs/${user.id}`}>
                    <Button variant="outline" className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                      ⚙️ Gérer
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Équipes possédées */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Équipes créées ({user.ownedTeams.length})
            </h2>
            {user.ownedTeams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune équipe créée</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.ownedTeams.map((team: any) => (
                  <Link
                    key={team.id}
                    href={`/equipes/${team.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{team.name}</h3>
                      <span className="text-primary-600 font-medium text-sm">{team.tag}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{team.game}</p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>👥 {team._count.players}</span>
                      <span>🏆 {team._count.tournamentTeams}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Équipes rejointes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Équipes rejointes ({user.teamPlayers.length})
            </h2>
            {user.teamPlayers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune équipe rejointe</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.teamPlayers.map((tp: any) => (
                  <Link
                    key={tp.id}
                    href={`/equipes/${tp.team.id}`}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900">{tp.team.name}</h3>
                      <span className="text-primary-600 font-medium text-sm">{tp.team.tag}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{tp.team.game}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>👥 {tp.team._count.players}</span>
                        <span>🏆 {tp.team._count.tournamentTeams}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tp.role === 'CAPTAIN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tp.role === 'CAPTAIN' ? '👑' : '🎮'}
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
