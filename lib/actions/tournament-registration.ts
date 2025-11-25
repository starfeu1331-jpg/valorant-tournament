'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Annuler son inscription (si PENDING)
export async function cancelRegistration(tournamentTeamId: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Non authentifié')
  }

  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    include: { team: true, tournament: true },
  })

  if (!tournamentTeam) {
    throw new Error('Inscription introuvable')
  }

  // Vérifier que l'utilisateur est le propriétaire de l'équipe
  if (tournamentTeam.team.ownerId !== session.user.id) {
    throw new Error('Seul le propriétaire de l\'équipe peut annuler l\'inscription')
  }

  // Ne peut annuler que si PENDING
  if (tournamentTeam.status !== 'PENDING') {
    throw new Error('Vous ne pouvez annuler que les inscriptions en attente')
  }

  // Supprimer l'inscription
  await prisma.tournamentTeam.delete({
    where: { id: tournamentTeamId },
  })

  revalidatePath(`/teams/${tournamentTeam.teamId}`)
  revalidatePath(`/tournaments/${tournamentTeam.tournamentId}`)
  
  return { success: true }
}

// Demander à quitter le tournoi (si ACCEPTED)
export async function requestWithdraw(tournamentTeamId: string, reason: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    throw new Error('Non authentifié')
  }

  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    include: { team: true, tournament: true },
  })

  if (!tournamentTeam) {
    throw new Error('Inscription introuvable')
  }

  // Vérifier que l'utilisateur est le propriétaire de l'équipe
  if (tournamentTeam.team.ownerId !== session.user.id) {
    throw new Error('Seul le propriétaire de l\'équipe peut demander un retrait')
  }

  // Ne peut demander un retrait que si ACCEPTED
  if (tournamentTeam.status !== 'ACCEPTED') {
    throw new Error('Vous ne pouvez demander un retrait que pour les inscriptions acceptées')
  }

  // Mettre à jour le statut et la raison
  await prisma.tournamentTeam.update({
    where: { id: tournamentTeamId },
    data: {
      status: 'WITHDRAW_REQUESTED',
      withdrawReason: reason,
      withdrawRequestedAt: new Date(),
    },
  })

  // Créer un log staff (visible dans le staff dashboard)
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'WITHDRAW_REQUEST',
      resourceType: 'TournamentTeam',
      resourceId: tournamentTeamId,
      description: `Demande de retrait du tournoi "${tournamentTeam.tournament.name}" par l'équipe "${tournamentTeam.team.name}": ${reason}`,
      tournamentId: tournamentTeam.tournamentId,
    },
  })

  // Pas de notification pour le joueur

  revalidatePath(`/teams/${tournamentTeam.teamId}`)
  revalidatePath(`/staff/tournaments/${tournamentTeam.tournamentId}`)
  
  return { success: true }
}

// Staff : Accepter une demande de retrait
export async function approveWithdraw(tournamentTeamId: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    include: { team: true, tournament: true },
  })

  if (!tournamentTeam) {
    throw new Error('Inscription introuvable')
  }

  // Marquer l'équipe comme REMOVED au lieu de la supprimer
  await prisma.tournamentTeam.update({
    where: { id: tournamentTeamId },
    data: {
      status: 'REMOVED',
      rejectionReason: tournamentTeam.withdrawReason || 'Retrait accepté par le staff',
      rejectedBy: session.user.id,
    },
  })

  // Logger l'action
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'APPROVE_WITHDRAW',
      resourceType: 'TournamentTeam',
      resourceId: tournamentTeamId,
      description: `Retrait approuvé pour l'équipe "${tournamentTeam.team.name}" du tournoi "${tournamentTeam.tournament.name}"`,
      tournamentId: tournamentTeam.tournamentId,
    },
  })

  // Pas de notification pour le joueur

  revalidatePath(`/staff/tournaments/${tournamentTeam.tournamentId}`)
  revalidatePath(`/tournaments/${tournamentTeam.tournamentId}`)
  
  return { success: true }
}

// Staff : Refuser une demande de retrait
export async function rejectWithdraw(tournamentTeamId: string) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    include: { team: true, tournament: true },
  })

  if (!tournamentTeam) {
    throw new Error('Inscription introuvable')
  }

  // Remettre le statut à ACCEPTED
  await prisma.tournamentTeam.update({
    where: { id: tournamentTeamId },
    data: {
      status: 'ACCEPTED',
      withdrawReason: null,
      withdrawRequestedAt: null,
    },
  })

  // Logger l'action
  await prisma.staffActionLog.create({
    data: {
      staffId: session.user.id,
      actionType: 'REJECT_WITHDRAW',
      resourceType: 'TournamentTeam',
      resourceId: tournamentTeamId,
      description: `Demande de retrait refusée pour l'équipe "${tournamentTeam.team.name}" du tournoi "${tournamentTeam.tournament.name}"`,
      tournamentId: tournamentTeam.tournamentId,
    },
  })

  // Pas de notification pour le joueur

  revalidatePath(`/staff/tournaments/${tournamentTeam.tournamentId}`)
  revalidatePath(`/teams/${tournamentTeam.teamId}`)
  
  return { success: true }
}
