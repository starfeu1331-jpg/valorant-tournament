import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function StaffTeamManagePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/auth/signin')
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      players: {
        include: {
          user: true,
        },
      },
      tournamentTeams: {
        include: {
          tournament: true,
        },
      },
    },
  })

  if (!team) {
    notFound()
  }

  async function deleteTeam() {
    'use server'
    await prisma.team.delete({
      where: { id: params.id },
    })
    revalidatePath('/equipes')
    revalidatePath('/staff/equipes')
    redirect('/equipes')
  }

  async function removePlayer(formData: FormData) {
    'use server'
    const playerId = formData.get('playerId') as string
    await prisma.teamPlayer.delete({
      where: { id: playerId },
    })
    revalidatePath(`/staff/equipes/${params.id}`)
    revalidatePath(`/equipes/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestion de l'équipe
                </h1>
                <p className="text-gray-600">
                  {team.name} • {team.tag}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/equipes/${team.id}`}>
                  <Button variant="outline">Voir public</Button>
                </Link>
                <Link href="/equipes">
                  <Button variant="outline">Retour</Button>
                </Link>
              </div>
            </div>

            {/* Infos équipe */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-600">Propriétaire:</span>
                <p className="text-gray-900">{team.owner.username}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Discord ID:</span>
                <p className="text-gray-900">{team.owner.discordId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{team.owner.email || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Créée le:</span>
                <p className="text-gray-900">{new Date(team.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Roster avec actions */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Roster ({team.players.length})
              </h2>
              <div className="space-y-2">
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
                        <p className="font-medium text-gray-900">{player.user.username}</p>
                        <p className="text-xs text-gray-500">{player.user.discordId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          player.role === 'CAPTAIN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {player.role === 'CAPTAIN' ? '👑 Capitaine' : 'Joueur'}
                      </span>
                      <form action={removePlayer}>
                        <input type="hidden" name="playerId" value={player.id} />
                        <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                          Retirer
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournois */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tournois inscrits ({team.tournamentTeams.length})
              </h2>
              {team.tournamentTeams.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun tournoi</p>
              ) : (
                <div className="space-y-2">
                  {team.tournamentTeams.map((tt: any) => (
                    <div
                      key={tt.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{tt.tournament.name}</p>
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
                        {tt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions dangereuses */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-red-600 mb-4">Zone de danger</h3>
              <form action={deleteTeam}>
                <Button type="submit" variant="outline" className="w-full bg-red-50 border-red-300 text-red-700 hover:bg-red-100">
                  🗑️ Supprimer définitivement cette équipe
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
