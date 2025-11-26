import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const overlaySlug = searchParams.get('overlay');
  let tournamentId: string | null = null;

  if (overlaySlug) {
    const overlay = await prisma.overlay.findUnique({ where: { slug: overlaySlug } });
    if (overlay && overlay.type === 'BRACKET' && overlay.config) {
      try {
        const config = JSON.parse(overlay.config);
        tournamentId = config.tournamentId;
      } catch {}
    }
  }

  let tournament = null;
  if (tournamentId) {
    tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: true,
        tournamentTeams: { include: { team: true } },
      },
    });
  } else {
    tournament = await prisma.tournament.findFirst({
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
    });
  }

  if (!tournament) {
    return NextResponse.json(null);
  }

  return NextResponse.json(tournament);
}
