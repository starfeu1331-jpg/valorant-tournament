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
import { RemoveTeamButton } from '@/components/staff/remove-team-button'

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
  const removedTeams = tournament.tournamentTeams.filter(tt => tt.status === 'REMOVED')
  const withdrawRequests = tournament.tournamentTeams.filter(tt => tt.status === 'WITHDRAW_REQUESTED')

  // Récupérer les modérateurs qui ont refusé/retiré des équipes
  const moderatorIds = [...rejectedTeams, ...removedTeams]
    .map(tt => tt.rejectedBy)
    .filter((id): id is string => id !== null)
  
  const moderators = await prisma.user.findMany({
    where: { id: { in: moderatorIds } },
    select: { id: true, username: true }
  })

  const moderatorsMap = new Map(moderators.map(u => [u.id, u.username]))

  return (
    <div className="min-h-screen bg-[url('/images/backgrounds/fond_of.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <Link href="/staff" className="text-red-400 hover:text-red-300 mb-2 inline-block">
            ← Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">{tournament.name}</h1>
          <p className="text-white/60 mt-1">{tournament.game}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Infos et actions rapides */}
        <div className="glass-card rounded-4xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-white/50">Statut actuel</h3>
              <p className="text-lg font-semibold mt-1 text-white">{tournament.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50">Équipes inscrites</h3>
              <p className="text-lg font-semibold mt-1 text-white">
                {acceptedTeams.length} / {tournament.maxTeams}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50">En attente</h3>
              <p className="text-lg font-semibold mt-1 text-yellow-400">{pendingTeams.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50">Matches</h3>
              <p className="text-lg font-semibold mt-1 text-white">{tournament.matches.length}</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <UpdateStatusButton tournamentId={tournament.id} currentStatus={tournament.status} />
            {acceptedTeams.length >= 2 && tournament.matches.length === 0 && (
              <GenerateBracketButton tournamentId={tournament.id} />
            )}
          </div>
        </div>

        {/* Équipes en attente de validation */}
        {pendingTeams.length > 0 && (
          <div className="glass-card rounded-4xl border border-white/20 p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Équipes en attente ({pendingTeams.length})
            </h2>
            <div className="space-y-4">
              {pendingTeams.map(tt => (
                <div key={tt.id} className="border border-white/20 rounded-2xl p-4 bg-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{tt.team.name}</h3>
                      <p className="text-white/70 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-white/50">
                        Inscrit le {formatDate(tt.registeredAt)}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1 text-white/80">Joueurs:</p>
                        <ul className="text-sm text-white/60">
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
          <div className="glass-card rounded-4xl border border-orange-500/30 p-6 mb-8 bg-orange-500/5">
            <h2 className="text-2xl font-bold mb-6 text-orange-400">
              Demandes de retrait ({withdrawRequests.length})
            </h2>
            <div className="space-y-4">
              {withdrawRequests.map((tt: any) => (
                <div key={tt.id} className="border border-orange-500/30 rounded-2xl p-4 bg-orange-500/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white">{tt.team.name}</h3>
                      <p className="text-white/70 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-white/60 mb-2">
                        Demandé le {formatDate(tt.withdrawRequestedAt || tt.registeredAt)}
                      </p>
                      {tt.withdrawReason && (
                        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-orange-500/20">
                          <p className="text-sm font-medium text-orange-400 mb-1">Raison :</p>
                          <p className="text-sm text-white/70">{tt.withdrawReason}</p>
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
                        <Button type="submit" className="bg-white/5 border border-red-500/30 text-red-400 hover:bg-red-500/10">
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
        <div className="glass-card rounded-4xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Équipes acceptées ({acceptedTeams.length})
          </h2>
          {acceptedTeams.length === 0 ? (
            <p className="text-white/50 text-center py-8">Aucune équipe acceptée</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedTeams.map(tt => (
                <div key={tt.id} className="border border-white/20 rounded-2xl p-4 bg-white/5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{tt.team.name}</h3>
                      <p className="text-sm text-white/70">[{tt.team.tag}]</p>
                      <p className="text-xs text-white/50 mt-2">
                        {tt.team.players.length} joueur(s)
                      </p>
                    </div>
                    <RemoveTeamButton
                      tournamentTeamId={tt.id}
                      teamName={tt.team.name}
                      tournamentId={params.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Équipes refusées */}
        {rejectedTeams.length > 0 && (
          <div className="glass-card rounded-4xl border border-red-500/30 p-6 mb-8 bg-red-500/5">
            <h2 className="text-2xl font-bold mb-6 text-red-400">
              Équipes refusées ({rejectedTeams.length})
            </h2>
            <div className="space-y-4">
              {rejectedTeams.map((tt: any) => (
                <div key={tt.id} className="border border-red-500/30 rounded-2xl p-4 bg-red-500/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{tt.team.name}</h3>
                      <p className="text-white/70 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-white/60 mb-2">
                        Inscrit le {formatDate(tt.registeredAt)}
                      </p>
                      {tt.rejectionReason && (
                        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-red-500/20">
                          <p className="text-sm font-medium text-red-400 mb-1">Raison du refus :</p>
                          <p className="text-sm text-white/70">{tt.rejectionReason}</p>
                        </div>
                      )}
                      {tt.rejectedBy && moderatorsMap.get(tt.rejectedBy) && (
                        <p className="text-xs text-white/50 mt-2">
                          Refusé par : <span className="font-medium text-white/70">{String(moderatorsMap.get(tt.rejectedBy))}</span>
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1 text-white/80">Joueurs :</p>
                        <ul className="text-sm text-white/60">
                          {tt.team.players.map((player: any) => (
                            <li key={player.id}>
                              {player.user.username} {player.role && `(${player.role})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <form action={async () => {
                      'use server'
                      const { validateTeam } = await import('@/lib/actions/staff')
                      await validateTeam(tt.id, 'ACCEPTED')
                      revalidatePath(`/staff/tournaments/${params.id}`)
                    }}>
                      <Button type="submit" className="bg-white/5 border border-green-500/30 text-green-400 hover:bg-green-500/10">
                        ↺ Réexaminer
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Équipes retirées */}
        {removedTeams.length > 0 && (
          <div className="glass-card rounded-4xl border border-orange-500/30 p-6 mb-8 bg-orange-500/5">
            <h2 className="text-2xl font-bold mb-6 text-orange-400">
              Équipes retirées ({removedTeams.length})
            </h2>
            <div className="space-y-4">
              {removedTeams.map((tt: any) => (
                <div key={tt.id} className="border border-orange-500/30 rounded-2xl p-4 bg-orange-500/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{tt.team.name}</h3>
                      <p className="text-white/70 mb-2">[{tt.team.tag}]</p>
                      <p className="text-sm text-white/60 mb-2">
                        Inscrit le {formatDate(tt.registeredAt)}
                      </p>
                      {tt.rejectionReason && (
                        <div className="mt-3 p-3 bg-black/20 rounded-xl border border-orange-500/20">
                          <p className="text-sm font-medium text-orange-400 mb-1">Raison du retrait :</p>
                          <p className="text-sm text-white/70">{tt.rejectionReason}</p>
                        </div>
                      )}
                      {tt.rejectedBy && moderatorsMap.get(tt.rejectedBy) && (
                        <p className="text-xs text-white/50 mt-2">
                          Retiré par : <span className="font-medium text-white/70">{String(moderatorsMap.get(tt.rejectedBy))}</span>
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1 text-white/80">Joueurs :</p>
                        <ul className="text-sm text-white/60">
                          {tt.team.players.map((player: any) => (
                            <li key={player.id}>
                              {player.user.username} {player.role && `(${player.role})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <form action={async () => {
                      'use server'
                      const { validateTeam } = await import('@/lib/actions/staff')
                      await validateTeam(tt.id, 'ACCEPTED')
                      revalidatePath(`/staff/tournaments/${params.id}`)
                    }}>
                      <Button type="submit" className="bg-white/5 border border-green-500/30 text-green-400 hover:bg-green-500/10">
                        ↺ Réintégrer
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket et matches */}
        <div className="glass-card rounded-4xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold mb-6 text-white">
            Bracket & Matches ({tournament.matches.length})
          </h2>
          {tournament.matches.length === 0 ? (
            <p className="text-white/50 text-center py-8">Aucun match créé</p>
          ) : (
            <div className="space-y-6">
              {Array.from(new Set(tournament.matches.map((m: any) => m.round))).map((round: any) => (
                <div key={round}>
                  <h3 className="text-xl font-semibold mb-4 text-white/90">{round}</h3>
                  <div className="space-y-3">
                    {tournament.matches
                      .filter((m: any) => m.round === round)
                      .map((match: any) => (
                        <div key={match.id} className="border border-white/20 rounded-2xl p-4 bg-white/5">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <p className="font-medium text-white">
                                {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                              </p>
                              {match.scheduledAt && (
                                <p className="text-sm text-white/60">
                                  {formatDate(match.scheduledAt)}
                                </p>
                              )}
                              {match.status === 'COMPLETED' && (
                                <p className="text-lg font-bold mt-2 text-white">
                                  {match.scoreTeamA} - {match.scoreTeamB}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs border ${
                                  match.status === 'COMPLETED'
                                    ? 'bg-white/10 text-white/70 border-white/20'
                                    : match.status === 'ONGOING'
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                }`}
                              >
                                {match.status}
                              </span>
                              {match.teamA && match.teamB && (
                                <Link href={`/staff/matches/${match.id}`}>
                                  <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl" size="sm">
                                    <span className="md:hidden">⚙️</span>
                                    <span className="hidden md:inline">Gérer</span>
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
          )}
        </div>
      </div>
    </div>
  )
}
