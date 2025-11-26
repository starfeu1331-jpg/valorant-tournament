import { prisma } from '@/lib/prisma'
import LiveOverlay from '@/components/overlay/live-overlay'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getActiveTournament() {
  // Récupère le tournoi en cours avec tous ses matchs
  const tournament = await prisma.tournament.findFirst({
    where: {
      status: 'ONGOING'
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

  return tournament
}

export default async function LiveOverlayPage() {
  const tournament = await getActiveTournament()

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <p className="text-white/70 text-2xl">Aucun tournoi en cours</p>
        </div>
      </div>
    )
  }

  return <LiveOverlay tournament={tournament} />
}
