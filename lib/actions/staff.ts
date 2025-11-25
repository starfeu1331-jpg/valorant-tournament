'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from './notifications'

export async function createTournament(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const name = formData.get('name') as string
  const game = formData.get('game') as string
  const description = formData.get('description') as string
  const rules = formData.get('rules') as string
  const maxTeams = parseInt(formData.get('maxTeams') as string)
  const format = formData.get('format') as string
  const matchFormat = formData.get('matchFormat') as string
  const registrationOpenAt = new Date(formData.get('registrationOpenAt') as string)
  const registrationCloseAt = new Date(formData.get('registrationCloseAt') as string)
  const startDate = new Date(formData.get('startDate') as string)
  const pickBanEnabled = formData.get('pickBanEnabled') === 'true'

  const tournament = await prisma.tournament.create({
    data: {
      name,
      game,
      description,
      rules,
      maxTeams,
      format,
      matchFormat,
      status: 'UPCOMING',
      registrationOpenAt,
      registrationCloseAt,
      startDate,
      pickBanEnabled,
    },
  })

  // Log l'action
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'CREATE_TOURNAMENT',
      resourceType: 'Tournament',
      resourceId: tournament.id,
      description: `Création du tournoi "${tournament.name}"`,
      tournamentId: tournament.id,
    },
  })

  revalidatePath('/staff')
  redirect('/staff/tournaments/' + tournament.id)
}

export async function updateTournamentStatus(tournamentId: string, status: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status },
  })

  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'UPDATE_TOURNAMENT_STATUS',
      resourceType: 'Tournament',
      resourceId: tournamentId,
      description: `Changement du statut du tournoi à "${status}"`,
      tournamentId,
    },
  })

  revalidatePath(`/staff/tournaments/${tournamentId}`)
}

export async function validateTeam(tournamentTeamId: string, status: 'ACCEPTED' | 'REJECTED', rejectionReason?: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const tournamentTeam = await prisma.tournamentTeam.update({
    where: { id: tournamentTeamId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      rejectedBy: status === 'REJECTED' ? session.user.id : null,
    },
    include: {
      tournament: true,
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
  })

  // Créer une notification pour le propriétaire de l'équipe
  if (status === 'ACCEPTED') {
    await createNotification(
      tournamentTeam.team.ownerId,
      'TEAM_VALIDATED',
      '✅ Équipe acceptée !',
      `Votre équipe "${tournamentTeam.team.name}" a été acceptée pour le tournoi "${tournamentTeam.tournament.name}"`,
      tournamentTeam.tournamentId
    )
  } else if (status === 'REJECTED') {
    await createNotification(
      tournamentTeam.team.ownerId,
      'TEAM_REJECTED',
      '❌ Équipe refusée',
      `Votre équipe "${tournamentTeam.team.name}" a été refusée pour le tournoi "${tournamentTeam.tournament.name}". ${rejectionReason ? `Raison: ${rejectionReason}` : 'Contactez le staff Discord pour plus d\'informations.'}`,
      tournamentTeam.tournamentId
    )
  }

  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'VALIDATE_TEAM',
      resourceType: 'Team',
      resourceId: tournamentTeam.teamId,
      description: `${status === 'ACCEPTED' ? 'Acceptation' : 'Refus'} de l'équipe "${tournamentTeam.team.name}" pour le tournoi "${tournamentTeam.tournament.name}"`,
      tournamentId: tournamentTeam.tournamentId,
    },
  })

  revalidatePath(`/staff/tournaments/${tournamentTeam.tournamentId}`)
}

export async function generateBracket(tournamentId: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      tournamentTeams: {
        where: { status: 'ACCEPTED' },
        include: { team: true },
      },
    },
  })

  if (!tournament) {
    throw new Error('Tournoi introuvable')
  }

  const teams = tournament.tournamentTeams

  if (teams.length < 2) {
    throw new Error('Il faut au moins 2 équipes pour générer un bracket')
  }

  // Simple élimination : calculer le nombre de rounds
  const numTeams = teams.length
  const numRounds = Math.ceil(Math.log2(numTeams))
  
  // Rounds: Round 1, Round 2, ..., Finale
  const rounds = []
  for (let i = 1; i <= numRounds; i++) {
    if (i === numRounds) {
      rounds.push('Finale')
    } else if (i === numRounds - 1) {
      rounds.push('Demi-finales')
    } else if (i === numRounds - 2) {
      rounds.push('Quarts de finale')
    } else {
      rounds.push(`Round ${i}`)
    }
  }

  // Générer les matches du premier round
  const firstRoundMatches = []
  const matchesInFirstRound = Math.pow(2, numRounds - 1)
  
  for (let i = 0; i < matchesInFirstRound; i++) {
    const teamA = teams[i * 2]
    const teamB = teams[i * 2 + 1]

    firstRoundMatches.push({
      tournamentId,
      round: rounds[0],
      matchNumber: i + 1,
      teamAId: teamA?.teamId || null,
      teamBId: teamB?.teamId || null,
      status: 'SCHEDULED',
      scheduledAt: new Date(tournament.startDate.getTime() + i * 60 * 60 * 1000), // Espacer d'1h
    })
  }

  // Créer tous les matches (premier round + rounds suivants vides)
  await prisma.match.createMany({
    data: firstRoundMatches,
  })

  // Créer les matches des rounds suivants (sans équipes)
  for (let roundIndex = 1; roundIndex < numRounds; roundIndex++) {
    const matchesInRound = Math.pow(2, numRounds - roundIndex - 1)
    
    for (let i = 0; i < matchesInRound; i++) {
      await prisma.match.create({
        data: {
          tournamentId,
          round: rounds[roundIndex],
          matchNumber: i + 1,
          status: 'SCHEDULED',
          scheduledAt: new Date(
            tournament.startDate.getTime() +
              (roundIndex * 24 * 60 * 60 * 1000) + // Jour suivant pour chaque round
              i * 60 * 60 * 1000
          ),
        },
      })
    }
  }

  // Log l'action
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'GENERATE_BRACKET',
      resourceType: 'Tournament',
      resourceId: tournamentId,
      description: `Génération du bracket pour "${tournament.name}"`,
      tournamentId,
    },
  })

  revalidatePath(`/staff/tournaments/${tournamentId}`)
}

export async function updateMatchScore(
  matchId: string,
  scoreTeamA: number,
  scoreTeamB: number,
  winnerId: string
) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreTeamA,
      scoreTeamB,
      winnerId,
      status: 'COMPLETED',
    },
    include: {
      tournament: true,
    },
  })

  // Avancer le vainqueur au prochain round (à implémenter)

  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'UPDATE_MATCH',
      resourceType: 'Match',
      resourceId: matchId,
      description: `Mise à jour du score: ${scoreTeamA} - ${scoreTeamB}`,
      matchId,
      tournamentId: match.tournamentId,
    },
  })

  revalidatePath(`/staff/tournaments/${match.tournamentId}`)
}

export async function removeTeamFromTournament(tournamentTeamId: string, removalReason?: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    include: {
      tournament: true,
      team: true,
    },
  })

  if (!tournamentTeam) {
    throw new Error('Équipe introuvable')
  }

  // Marquer l'équipe comme REMOVED au lieu de la supprimer
  await prisma.tournamentTeam.update({
    where: { id: tournamentTeamId },
    data: {
      status: 'REMOVED',
      rejectionReason: removalReason || 'Retirée par le staff',
      rejectedBy: session.user.id,
    },
  })

  // Créer une notification pour le propriétaire de l'équipe
  await createNotification(
    tournamentTeam.team.ownerId,
    'TEAM_REJECTED',
    '⚠️ Équipe retirée du tournoi',
    `Votre équipe "${tournamentTeam.team.name}" a été retirée du tournoi "${tournamentTeam.tournament.name}". ${removalReason ? `Raison: ${removalReason}` : ''}`,
    tournamentTeam.tournamentId
  )

  // Log l'action
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'REMOVE_TEAM',
      resourceType: 'Team',
      resourceId: tournamentTeam.teamId,
      description: `Retrait de l'équipe "${tournamentTeam.team.name}" du tournoi "${tournamentTeam.tournament.name}". ${removalReason ? `Raison: ${removalReason}` : ''}`,
      tournamentId: tournamentTeam.tournamentId,
    },
  })

  revalidatePath(`/staff/tournaments/${tournamentTeam.tournamentId}`)
}
