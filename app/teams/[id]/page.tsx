import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { cancelRegistration, requestWithdraw } from '@/lib/actions/tournament-registration'
import { invitePlayerToTeam } from '@/lib/actions/invitations'
import { revalidatePath } from 'next/cache'

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { error?: string; success?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/teams/${params.id}`)
  }

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

  const isOwner = team.ownerId === session.user.id
  const isMember = team.players.some((p: any) => p.userId === session.user.id)

  if (!isOwner && !isMember) {
    redirect('/teams')
  }

  async function handleInvite(formData: FormData) {
    'use server'
    const username = formData.get('username') as string
    try {
      await invitePlayerToTeam(params.id, username)
      redirect(`/teams/${params.id}?success=Invitation envoyée avec succès`)
    } catch (error: any) {
      redirect(`/teams/${params.id}?error=${encodeURIComponent(error.message)}`)
    }
  }

  async function handleCancelRegistration(formData: FormData) {
    'use server'
    const tournamentTeamId = formData.get('tournamentTeamId') as string
    await cancelRegistration(tournamentTeamId)
    revalidatePath(`/teams/${params.id}`)
  }

  async function handleRequestWithdraw(formData: FormData) {
    'use server'
    const tournamentTeamId = formData.get('tournamentTeamId') as string
    const reason = formData.get('reason') as string
    if (!reason || reason.trim() === '') {
      throw new Error('Veuillez fournir une raison pour votre demande de retrait')
    }
    await requestWithdraw(tournamentTeamId, reason)
    revalidatePath(`/teams/${params.id}`)
  }

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Messages d'erreur / succès */}
          {searchParams.error && (
            <Alert type="error" message={searchParams.error} teamId={params.id} />
          )}
          {searchParams.success && (
            <Alert type="success" message={searchParams.success} teamId={params.id} />
          )}

          {/* En-tête */}
          <div className="glass-card rounded-4xl border border-white/20 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                  <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full font-bold">
                    {team.tag}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span className="flex items-center gap-2">
                    🎮 <strong>{team.game}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    👤 <strong>{team.owner.username}</strong> (Propriétaire)
                  </span>
                </div>
                {team.description && (
                  <p className="text-white/80 mt-4">{team.description}</p>
                )}
              </div>
              <Link href="/teams">
                <Button variant="outline">Retour</Button>
              </Link>
            </div>
          </div>

          {/* Roster */}
          <div className="glass-card rounded-4xl border border-white/20 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Roster ({team.players.length})
              </h2>
            </div>

            {/* Formulaire d'invitation (propriétaire uniquement) */}
            {isOwner && (
              <form action={handleInvite} className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                  Inviter un joueur
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Nom d'utilisateur Discord"
                    required
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                  />
                  <Button type="submit">
                    Inviter
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {team.players.map((player: any) => (
                <Link
                  key={player.id}
                  href={`/joueurs/${player.user.id}`}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {player.user.image && (
                      <img
                        src={player.user.image}
                        alt={player.user.username}
                        className="w-10 h-10 rounded-full border-2 border-white/20"
                      />
                    )}
                    <div>
                      <p className="font-medium text-white">{player.user.username}</p>
                      {player.user.riotId && (
                        <p className="text-sm text-white/70">{player.user.riotId}</p>
                      )}
                      {player.user.valorantRank && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {player.user.valorantRank}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        player.role === 'CAPTAIN'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-white/10 text-white/80 border border-white/20'
                      }`}
                    >
                      {player.role === 'CAPTAIN' ? '👑 Capitaine' : 'Joueur'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tournois */}
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Tournois ({team.tournamentTeams.length})
            </h2>
            {team.tournamentTeams.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                Aucune inscription à un tournoi
              </div>
            ) : (
              <div className="space-y-3">
                {team.tournamentTeams.map((tt: any) => (
                  <div
                    key={tt.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/tournaments/${tt.tournament.id}`} className="flex-1 hover:text-red-400">
                        <h3 className="font-bold text-white">{tt.tournament.name}</h3>
                        <p className="text-sm text-white/70">
                          {new Date(tt.tournament.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </Link>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tt.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : tt.status === 'PENDING'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : tt.status === 'WITHDRAW_REQUESTED'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {tt.status === 'ACCEPTED'
                          ? '✓ Validée'
                          : tt.status === 'PENDING'
                          ? '⏳ En attente'
                          : tt.status === 'WITHDRAW_REQUESTED'
                          ? '📤 Retrait demandé'
                          : '✗ Refusée'}
                      </span>
                    </div>

                    {/* Boutons d'action (owner uniquement) */}
                    {isOwner && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        {/* Annuler si PENDING */}
                        {tt.status === 'PENDING' && (
                          <form action={handleCancelRegistration} className="flex-1">
                            <input type="hidden" name="tournamentTeamId" value={tt.id} />
                            <Button type="submit" variant="outline" className="w-full text-red-600 border-red-500/30 hover:bg-red-500/10 bg-white/5">
                              ✗ Annuler l'inscription
                            </Button>
                          </form>
                        )}

                        {/* Demander le retrait si ACCEPTED */}
                        {tt.status === 'ACCEPTED' && (
                          <details className="flex-1">
                            <summary className="cursor-pointer text-sm font-medium text-orange-600 hover:text-orange-700">
                              📤 Demander un retrait
                            </summary>
                            <form action={handleRequestWithdraw} className="mt-2 space-y-2">
                              <input type="hidden" name="tournamentTeamId" value={tt.id} />
                              <textarea
                                name="reason"
                                placeholder="Raison de la demande de retrait..."
                                required
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 text-sm backdrop-blur-sm"
                                rows={3}
                              />
                              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                                Envoyer la demande
                              </Button>
                            </form>
                          </details>
                        )}

                        {/* Message si retrait demandé */}
                        {tt.status === 'WITHDRAW_REQUESTED' && (
                          <div className="flex-1 text-sm text-orange-300 bg-orange-500/10 p-2 rounded border border-orange-500/30">
                            <p className="font-medium">Demande de retrait envoyée au staff</p>
                            {tt.withdrawReason && (
                              <p className="text-xs mt-1">Raison : {tt.withdrawReason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
