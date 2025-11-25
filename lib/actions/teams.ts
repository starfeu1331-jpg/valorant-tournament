'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from './notifications'

export async function createTeam(formData: FormData) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  const name = formData.get('name') as string
  const tag = formData.get('tag') as string
  const game = formData.get('game') as string
  const description = formData.get('description') as string

  if (!name || !tag || !game) {
    throw new Error('Nom, tag et jeu requis')
  }

  const team = await prisma.team.create({
    data: {
      name,
      tag,
      game,
      description,
      ownerId: session.user.id,
    },
  })

  // Ajouter le créateur comme joueur de l'équipe
  await prisma.teamPlayer.create({
    data: {
      teamId: team.id,
      userId: session.user.id,
      role: 'CAPTAIN',
    },
  })

  revalidatePath('/teams')
  redirect('/teams')
}

export async function getMyTeams() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return []
  }

  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          players: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      players: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          tournamentTeams: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return teams
}

export async function registerTeamToTournament(tournamentId: string, teamId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  // Vérifier que l'utilisateur est membre de l'équipe
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        {
          players: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
  })

  if (!team) {
    throw new Error('Équipe non trouvée ou accès refusé')
  }

  // Vérifier que le tournoi accepte les inscriptions
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  })

  if (!tournament) {
    throw new Error('Tournoi non trouvé')
  }

  if (tournament.status !== 'REGISTRATION_OPEN') {
    throw new Error('Les inscriptions ne sont pas ouvertes')
  }

  // Vérifier que l'équipe n'est pas déjà inscrite
  const existing = await prisma.tournamentTeam.findFirst({
    where: {
      tournamentId,
      teamId,
    },
  })

  if (existing) {
    throw new Error('Équipe déjà inscrite')
  }

  // Inscrire l'équipe
  await prisma.tournamentTeam.create({
    data: {
      tournamentId,
      teamId,
      status: 'PENDING',
    },
  })

  // Créer une notification pour le propriétaire de l'équipe
  await createNotification(
    session.user.id,
    'REGISTRATION_SUBMITTED',
    '📝 Inscription en attente',
    `Votre équipe "${team.name}" a été inscrite au tournoi "${tournament.name}". Elle est maintenant en attente de validation par le staff.`,
    tournamentId
  )

  revalidatePath(`/tournaments/${tournamentId}`)
  return { success: true }
}
