'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Inviter un joueur dans une équipe
export async function invitePlayerToTeam(teamId: string, username: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  // Vérifier que l'utilisateur est propriétaire ou capitaine
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      OR: [
        { ownerId: session.user.id },
        {
          players: {
            some: {
              userId: session.user.id,
              role: 'CAPTAIN',
            },
          },
        },
      ],
    },
  })

  if (!team) {
    throw new Error('Vous n\'avez pas les permissions pour inviter des joueurs')
  }

  // Trouver l'utilisateur à inviter (recherche insensible à la casse)
  const invitedUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        ...(process.env.DATABASE_URL?.includes('postgresql') && { mode: 'insensitive' as const }),
      },
    },
  })

  if (!invitedUser) {
    throw new Error('Joueur non trouvé. Le joueur doit d\'abord créer un compte sur la plateforme en se connectant avec Discord.')
  }

  // Vérifier qu'il n'est pas déjà dans l'équipe
  const existingPlayer = await prisma.teamPlayer.findFirst({
    where: {
      teamId,
      userId: invitedUser.id,
    },
  })

  if (existingPlayer) {
    throw new Error('Ce joueur est déjà dans l\'équipe')
  }

  // Vérifier qu'il n'y a pas déjà une invitation en attente
  const existingInvitation = await prisma.teamInvitation.findFirst({
    where: {
      teamId,
      invitedUserId: invitedUser.id,
      status: 'PENDING',
    },
  })

  if (existingInvitation) {
    throw new Error('Une invitation est déjà en attente pour ce joueur')
  }

  // Créer l'invitation
  await prisma.teamInvitation.create({
    data: {
      teamId,
      invitedById: session.user.id,
      invitedUserId: invitedUser.id,
      status: 'PENDING',
    },
  })

  revalidatePath(`/teams/${teamId}`)
  return { success: true }
}

// Accepter une invitation
export async function acceptInvitation(invitationId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
    include: { team: true },
  })

  if (!invitation) {
    throw new Error('Invitation non trouvée')
  }

  if (invitation.invitedUserId !== session.user.id) {
    throw new Error('Cette invitation ne vous est pas destinée')
  }

  if (invitation.status !== 'PENDING') {
    throw new Error('Cette invitation n\'est plus valide')
  }

  // Ajouter le joueur à l'équipe
  await prisma.teamPlayer.create({
    data: {
      teamId: invitation.teamId,
      userId: session.user.id,
      role: 'PLAYER',
    },
  })

  // Mettre à jour l'invitation
  await prisma.teamInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
    },
  })

  revalidatePath('/teams')
  revalidatePath(`/teams/${invitation.teamId}`)
  return { success: true, teamId: invitation.teamId }
}

// Refuser une invitation
export async function declineInvitation(invitationId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  const invitation = await prisma.teamInvitation.findUnique({
    where: { id: invitationId },
  })

  if (!invitation) {
    throw new Error('Invitation non trouvée')
  }

  if (invitation.invitedUserId !== session.user.id) {
    throw new Error('Cette invitation ne vous est pas destinée')
  }

  await prisma.teamInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'DECLINED',
      respondedAt: new Date(),
    },
  })

  revalidatePath('/teams')
  return { success: true }
}

// Récupérer mes invitations en attente
export async function getMyInvitations() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return []
  }

  const invitations = await prisma.teamInvitation.findMany({
    where: {
      invitedUserId: session.user.id,
      status: 'PENDING',
    },
    include: {
      team: {
        include: {
          owner: true,
        },
      },
      invitedBy: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return invitations
}
