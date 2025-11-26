import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: {
        id: params.id
      },
      include: {
        tournamentTeams: {
          where: {
            status: 'APPROVED'
          },
          include: {
            team: {
              include: {
                players: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        matches: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            teamA: {
              include: {
                players: {
                  include: {
                    user: true
                  }
                }
              }
            },
            teamB: {
              include: {
                players: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournoi non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Erreur lors de la récupération du tournoi:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
