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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Messages d'erreur / succès */}
          {searchParams.error && (
            <Alert type="error" message={searchParams.error} teamId={params.id} />
          )}
          {searchParams.success && (
            <Alert type="success" message={searchParams.success} teamId={params.id} />
          )}

          {/* En-tête */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
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
              <Link href="/teams">
                <Button variant="outline">Retour</Button>
              </Link>
            </div>
          </div>

          {/* Roster */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Roster ({team.players.length})
              </h2>
            </div>

            {/* Formulaire d'invitation (propriétaire uniquement) */}
            {isOwner && (
              <form action={handleInvite} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
                  Inviter un joueur
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Nom d'utilisateur Discord"
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
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
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
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
                      {player.user.riotId && (
                        <p className="text-sm text-gray-600">{player.user.riotId}</p>
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
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
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
                  <div
                    key={tt.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Link href={`/tournaments/${tt.tournament.id}`} className="flex-1 hover:text-primary-600">
                        <h3 className="font-bold text-gray-900">{tt.tournament.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(tt.tournament.startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </Link>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tt.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : tt.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : tt.status === 'WITHDRAW_REQUESTED'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
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
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        {/* Annuler si PENDING */}
                        {tt.status === 'PENDING' && (
                          <form action={handleCancelRegistration} className="flex-1">
                            <input type="hidden" name="tournamentTeamId" value={tt.id} />
                            <Button type="submit" variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                          <div className="flex-1 text-sm text-orange-600 bg-orange-50 p-2 rounded">
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
