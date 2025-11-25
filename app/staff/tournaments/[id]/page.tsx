import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ValidateTeamButton } from '@/components/staff/validate-team-button'
import { GenerateBracketButton } from '@/components/staff/generate-bracket-button'
import { UpdateStatusButton } from '@/components/staff/update-status-button'

export default async function ManageTournamentPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/')
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      tournamentTeams: {
        include: {
          team: {
            include: {
              owner: true,
              players: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          registeredAt: 'asc',
        },
      },
      matches: {
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: {
          matchNumber: 'asc',
        },
      },
    },
  })

  if (!tournament) {
    redirect('/staff')
  }

  const pendingTeams = tournament.tournamentTeams.filter(tt => tt.status === 'PENDING')
  const acceptedTeams = tournament.tournamentTeams.filter(tt => tt.status === 'ACCEPTED')
  const rejectedTeams = tournament.tournamentTeams.filter(tt => tt.status === 'REJECTED')
  const withdrawRequests = tournament.tournamentTeams.filter(tt => tt.status === 'WITHDRAW_REQUESTED')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/staff" className="text-primary-600 hover:text-primary-700 mb-2 inline-block">
            ← Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
          <p className="text-gray-600 mt-1">{tournament.game}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Infos et actions rapides */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Statut actuel</h3>
              <p className="text-lg font-semibold mt-1">{tournament.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Équipes inscrites</h3>
              <p className="text-lg font-semibold mt-1">
                {acceptedTeams.length} / {tournament.maxTeams}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">En attente</h3>
              <p className="text-lg font-semibold mt-1 text-yellow-600">{pendingTeams.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Matches</h3>
              <p className="text-lg font-semibold mt-1">{tournament.matches.length}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <UpdateStatusButton tournamentId={tournament.id} currentStatus={tournament.status} />
            {acceptedTeams.length >= 2 && tournament.matches.length === 0 && (
              <GenerateBracketButton tournamentId={tournament.id} />
            )}
          </div>
        </div>

        {/* Équipes en attente de validation */}
        {pendingTeams.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              Équipes en attente ({pendingTeams.length})
            </h2>
            <div className="space-y-4">
              {pendingTeams.map(tt => (
                <div key={tt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{tt.team.name}</h3>
                      <p className="text-gray-600 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-gray-500">
                        Inscrit le {formatDate(tt.registeredAt)}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Joueurs:</p>
                        <ul className="text-sm text-gray-600">
                          {tt.team.players.map(player => (
                            <li key={player.id}>
                              {player.user.username} {player.role && `(${player.role})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <ValidateTeamButton tournamentTeamId={tt.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demandes de retrait */}
        {withdrawRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-orange-700">
              Demandes de retrait ({withdrawRequests.length})
            </h2>
            <div className="space-y-4">
              {withdrawRequests.map((tt: any) => (
                <div key={tt.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{tt.team.name}</h3>
                      <p className="text-gray-600 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Demandé le {formatDate(tt.withdrawRequestedAt || tt.registeredAt)}
                      </p>
                      {tt.withdrawReason && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm font-medium text-gray-700 mb-1">Raison :</p>
                          <p className="text-sm text-gray-600">{tt.withdrawReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <form action={async () => {
                        'use server'
                        const { approveWithdraw } = await import('@/lib/actions/tournament-registration')
                        await approveWithdraw(tt.id)
                        revalidatePath(`/staff/tournaments/${params.id}`)
                      }}>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700">
                          ✓ Approuver
                        </Button>
                      </form>
                      <form action={async () => {
                        'use server'
                        const { rejectWithdraw } = await import('@/lib/actions/tournament-registration')
                        await rejectWithdraw(tt.id)
                        revalidatePath(`/staff/tournaments/${params.id}`)
                      }}>
                        <Button type="submit" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                          ✗ Refuser
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Équipes acceptées */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Équipes acceptées ({acceptedTeams.length})
          </h2>
          {acceptedTeams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune équipe acceptée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedTeams.map(tt => (
                <div key={tt.id} className="border rounded-lg p-4">
                  <h3 className="font-bold">{tt.team.name}</h3>
                  <p className="text-sm text-gray-600">[{tt.team.tag}]</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {tt.team.players.length} joueur(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bracket et matches */}
        {tournament.matches.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Bracket & Matches</h2>
            <div className="space-y-6">
              {Array.from(new Set(tournament.matches.map((m: any) => m.round))).map((round: any) => (
                <div key={round}>
                  <h3 className="text-xl font-semibold mb-4">{round}</h3>
                  <div className="space-y-3">
                    {tournament.matches
                      .filter((m: any) => m.round === round)
                      .map((match: any) => (
                        <div key={match.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium">
                                {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                              </p>
                              {match.scheduledAt && (
                                <p className="text-sm text-gray-600">
                                  {formatDate(match.scheduledAt)}
                                </p>
                              )}
                              {match.status === 'COMPLETED' && (
                                <p className="text-lg font-bold mt-2">
                                  {match.scoreTeamA} - {match.scoreTeamB}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs ${
                                  match.status === 'COMPLETED'
                                    ? 'bg-gray-100 text-gray-800'
                                    : match.status === 'ONGOING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {match.status}
                              </span>
                              {match.teamA && match.teamB && match.status !== 'COMPLETED' && (
                                <Link href={`/staff/matches/${match.id}`}>
                                  <Button variant="outline" size="sm">
                                    Gérer
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
