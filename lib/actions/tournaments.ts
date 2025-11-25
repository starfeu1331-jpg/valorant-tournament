'use server'

import { prisma } from '@/lib/prisma'

export async function getTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: { tournamentTeams: true },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return tournaments
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois:', error)
    return []
  }
}

export async function getTournamentById(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        tournamentTeams: {
          include: {
            team: {
              include: {
                players: {
                  include: {
                    user: true,
                  },
                },
              },
            },
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

    return tournament
  } catch (error) {
    console.error('Erreur lors de la récupération du tournoi:', error)
    return null
  }
}
