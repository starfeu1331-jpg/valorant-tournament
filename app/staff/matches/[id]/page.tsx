import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function updateMatchScore(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const matchId = formData.get('matchId') as string
  const scoreTeamA = parseInt(formData.get('scoreTeamA') as string)
  const scoreTeamB = parseInt(formData.get('scoreTeamB') as string)
  const status = formData.get('status') as string

  // Récupérer le match pour avoir le tournamentId
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: true,
      teamB: true,
      tournament: true,
    },
  })

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreTeamA,
      scoreTeamB,
      status: status as any,
    },
  })

  // Si le match est terminé, déterminer le gagnant
  if (status === 'COMPLETED' && match) {
    const winnerId = scoreTeamA > scoreTeamB ? match.teamAId : match.teamBId

    if (!winnerId) {
      throw new Error('Impossible de déterminer le gagnant')
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
      },
    })

    // Notifier les équipes
    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({
        where: { id: match.teamAId! },
        include: { players: { include: { user: true } } },
      }),
      prisma.team.findUnique({
        where: { id: match.teamBId! },
        include: { players: { include: { user: true } } },
      }),
    ])

    const winnerTeam = winnerId === match.teamAId ? teamA : teamB
    const loserTeam = winnerId === match.teamAId ? teamB : teamA

    // Notifications pour l'équipe gagnante
    if (winnerTeam) {
      const winnerUserIds = winnerTeam.players.map(p => p.user.id)
      await prisma.notification.createMany({
        data: winnerUserIds.map(userId => ({
          userId,
          type: 'MATCH_RESULT',
          title: '🎉 Victoire !',
          message: `Votre équipe a gagné le match ${match.round} contre ${loserTeam?.name}`,
          relatedId: matchId,
        })),
      })
    }

    // Notifications pour l'équipe perdante
    if (loserTeam) {
      const loserUserIds = loserTeam.players.map(p => p.user.id)
      await prisma.notification.createMany({
        data: loserUserIds.map(userId => ({
          userId,
          type: 'MATCH_RESULT',
          title: 'Défaite',
          message: `Votre équipe a perdu le match ${match.round} contre ${winnerTeam?.name}`,
          relatedId: matchId,
        })),
      })
    }

    // Mettre à jour le bracket : ajouter le gagnant au prochain match
    await updateBracket(match, winnerId)
    
    // Si c'est la finale, marquer le tournoi comme terminé
    if (match.matchNumber === 7 || match.round.includes('Finale')) {
      await prisma.tournament.update({
        where: { id: match.tournamentId },
        data: { status: 'COMPLETED' },
      })
      
      // Notifier tous les joueurs du tournoi
      const allTeams = await prisma.tournamentTeam.findMany({
        where: { 
          tournamentId: match.tournamentId,
          status: 'ACCEPTED',
        },
        include: {
          team: {
            include: {
              players: {
                include: { user: true },
              },
            },
          },
        },
      })
      
      const allPlayerIds = allTeams.flatMap(tt => 
        tt.team.players.map(p => p.user.id)
      )
      
      if (winnerTeam) {
        await prisma.notification.createMany({
          data: allPlayerIds.map(userId => ({
            userId,
            type: 'TOURNAMENT_UPDATE',
            title: '🏆 Tournoi terminé !',
            message: `Le tournoi ${match.tournament.name} est terminé ! Vainqueur : ${winnerTeam.name}`,
            relatedId: match.tournamentId,
          })),
        })
      }
    }
  }

  revalidatePath(`/staff/matches/${matchId}`)
  revalidatePath(`/staff/tournaments/${match?.tournamentId}`)
}

async function updateBracket(completedMatch: any, winnerId: string) {
  'use server'
  
  const { round, matchNumber, tournamentId } = completedMatch

  // Déterminer le prochain match selon le round et matchNumber
  let nextRound: string | null = null
  let nextMatchNumber: number = 1
  let isFirstMatchOfPair = false

  // Pour les quarts de finale (matchNumber 1-4)
  if (matchNumber === 1 || matchNumber === 2) {
    nextRound = 'Demi-finale 1'
    nextMatchNumber = 5
    isFirstMatchOfPair = matchNumber === 1
  } else if (matchNumber === 3 || matchNumber === 4) {
    nextRound = 'Demi-finale 2'
    nextMatchNumber = 6
    isFirstMatchOfPair = matchNumber === 3
  } 
  // Pour les demi-finales (matchNumber 5-6)
  else if (matchNumber === 5 || matchNumber === 6) {
    nextRound = 'Finale'
    nextMatchNumber = 7
    isFirstMatchOfPair = matchNumber === 5
  }
  // Pour la finale (matchNumber 7)
  else if (matchNumber === 7) {
    // C'est la finale, marquer le tournoi comme terminé
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { 
        status: 'COMPLETED',
        endDate: new Date(),
      },
    })
    
    // Pas de prochain match
    return
  }

  if (!nextRound) {
    // C'est la finale, pas de prochain match
    return
  }

  // Trouver le prochain match par matchNumber
  const nextMatch = await prisma.match.findFirst({
    where: {
      tournamentId,
      matchNumber: nextMatchNumber,
    },
  })

  if (!nextMatch) {
    console.error(`Prochain match non trouvé: matchNumber=${nextMatchNumber}`)
    return
  }

  // Mettre à jour teamA ou teamB selon le match
  if (isFirstMatchOfPair) {
    // Premier match du duo -> teamA du prochain match
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { teamAId: winnerId },
    })
  } else {
    // Deuxième match du duo -> teamB du prochain match
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { teamBId: winnerId },
    })
  }

  // Vérifier si les deux équipes sont définies
  const updatedMatch = await prisma.match.findUnique({
    where: { id: nextMatch.id },
  })

  if (updatedMatch?.teamAId && updatedMatch?.teamBId) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { status: 'SCHEDULED' },
    })
  }
}

async function scheduleMatch(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const matchId = formData.get('matchId') as string
  const scheduledAt = formData.get('scheduledAt') as string

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scheduledAt: new Date(scheduledAt),
    },
  })

  // Notifier les équipes
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      teamA: { include: { players: { include: { user: true } } } },
      teamB: { include: { players: { include: { user: true } } } },
      tournament: true,
    },
  })

  if (match?.teamA && match.teamB) {
    const allPlayerIds = [
      ...match.teamA.players.map(p => p.user.id),
      ...match.teamB.players.map(p => p.user.id),
    ]

    await prisma.notification.createMany({
      data: allPlayerIds.map(userId => ({
        userId,
        type: 'MATCH_SCHEDULED',
        title: 'Match programmé',
        message: `${match.teamA!.name} vs ${match.teamB!.name} - ${formatDate(new Date(scheduledAt))}`,
        relatedId: matchId,
      })),
    })
  }

  revalidatePath(`/staff/matches/${matchId}`)
}

export default async function ManageMatchPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/')
  }

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      tournament: true,
      teamA: {
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      },
      teamB: {
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  })

  if (!match) {
    redirect('/staff')
  }

  // Récupérer l'équipe gagnante si elle existe
  const winner = match.winnerId
    ? await prisma.team.findUnique({
        where: { id: match.winnerId },
      })
    : null

  return (
    <div className="min-h-screen bg-[url('/images/backgrounds/fond_of.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-4 py-6">
          <Link href={`/staff/tournaments/${match.tournamentId}`} className="text-primary-400 hover:text-primary-300 mb-2 inline-block">
            ← Retour au tournoi
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
          </h1>
          <p className="text-white/60 mt-1">{match.tournament.name} - {match.round}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Infos du match */}
        <div className="glass-card rounded-4xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-white/50">Statut</h3>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border ${
                  match.status === 'COMPLETED'
                    ? 'bg-white/10 text-white/70 border-white/20'
                    : match.status === 'ONGOING'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}
              >
                {match.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50">Score actuel</h3>
              <p className="text-2xl font-bold mt-2 text-white">
                {match.scoreTeamA} - {match.scoreTeamB}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50">Match #{match.matchNumber}</h3>
              <p className="text-lg font-semibold mt-2 text-white">{match.round}</p>
            </div>
          </div>

          {match.scheduledAt && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-white/60">
                Programmé le {formatDate(match.scheduledAt)}
              </p>
            </div>
          )}

          {match.winnerId && winner && (
            <div className="pt-4 border-t border-white/10 mt-4">
              <p className="text-sm text-white/50">Gagnant</p>
              <p className="text-xl font-bold text-green-400 mt-1">
                {winner.name}
              </p>
            </div>
          )}
        </div>

        {/* Équipes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Équipe A */}
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              {match.teamA?.name || 'En attente'}
            </h2>
            {match.teamA ? (
              <>
                <p className="text-white/70 mb-4">[{match.teamA.tag}]</p>
                <div>
                  <p className="text-sm font-medium mb-2 text-white/80">Joueurs :</p>
                  <ul className="space-y-1 text-sm text-white/60">
                    {match.teamA.players.map(player => (
                      <li key={player.id}>
                        {player.user.username}
                        {player.role && ` (${player.role})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-white/50">Cette équipe sera déterminée plus tard</p>
            )}
          </div>

          {/* Équipe B */}
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4 text-white">
              {match.teamB?.name || 'En attente'}
            </h2>
            {match.teamB ? (
              <>
                <p className="text-white/70 mb-4">[{match.teamB.tag}]</p>
                <div>
                  <p className="text-sm font-medium mb-2 text-white/80">Joueurs :</p>
                  <ul className="space-y-1 text-sm text-white/60">
                    {match.teamB.players.map(player => (
                      <li key={player.id}>
                        {player.user.username}
                        {player.role && ` (${player.role})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-white/50">Cette équipe sera déterminée plus tard</p>
            )}
          </div>
        </div>

        {/* Programmer le match */}
        {match.status === 'SCHEDULED' && !match.scheduledAt && (
          <div className="glass-card rounded-4xl border border-white/20 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Programmer le match</h2>
            <form action={scheduleMatch} className="space-y-4">
              <input type="hidden" name="matchId" value={match.id} />
              <div>
                <label htmlFor="scheduledAt" className="block text-sm font-medium text-white/80 mb-2">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  id="scheduledAt"
                  name="scheduledAt"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl">
                Programmer le match
              </Button>
            </form>
          </div>
        )}

        {/* Gérer le score */}
        {match.teamA && match.teamB && match.status !== 'COMPLETED' && (
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-4 text-white">Gérer le résultat</h2>
            <form action={updateMatchScore} className="space-y-4">
              <input type="hidden" name="matchId" value={match.id} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="scoreTeamA" className="block text-sm font-medium text-white/80 mb-2">
                    Score {match.teamA.name}
                  </label>
                  <input
                    type="number"
                    id="scoreTeamA"
                    name="scoreTeamA"
                    defaultValue={match.scoreTeamA || 0}
                    min="0"
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="scoreTeamB" className="block text-sm font-medium text-white/80 mb-2">
                    Score {match.teamB.name}
                  </label>
                  <input
                    type="number"
                    id="scoreTeamB"
                    name="scoreTeamB"
                    defaultValue={match.scoreTeamB || 0}
                    min="0"
                    required
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-white/80 mb-2">
                  Statut du match
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={match.status}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SCHEDULED">Programmé</option>
                  <option value="ONGOING">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <Button type="submit" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 rounded-xl">
                  Enregistrer le résultat
                </Button>
                <Link href={`/staff/tournaments/${match.tournamentId}`}>
                  <Button type="button" className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Match terminé */}
        {match.status === 'COMPLETED' && (
          <div className="glass-card rounded-4xl border border-green-500/30 p-6 bg-green-500/5">
            <h2 className="text-xl font-bold mb-4 text-green-400">Match terminé</h2>
            <p className="text-white/80 mb-4">
              Ce match est terminé. Le gagnant est <span className="font-bold text-white">{winner?.name}</span>.
            </p>
            <Link href={`/staff/tournaments/${match.tournamentId}`}>
              <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl">
                ← Retour au tournoi
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
