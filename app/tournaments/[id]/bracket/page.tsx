import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BracketVisualizer from "@/components/tournaments/bracket-visualizer";

export default async function BracketPage({ params }: { params: { id: string } }) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
    include: {
      tournamentTeams: {
        where: { status: "ACCEPTED" },
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
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: {
          matchNumber: 'asc'
        }
      }
    }
  });

  if (!tournament) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="glass-card rounded-4xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-white mb-2">{tournament.name}</h1>
              <p className="text-white/70">Format: {tournament.format} | {tournament.matchFormat}</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                tournament.status === 'REGISTRATION_OPEN' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                tournament.status === 'ONGOING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                tournament.status === 'COMPLETED' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {tournament.status === 'REGISTRATION_OPEN' ? 'Inscriptions Ouvertes' :
                 tournament.status === 'ONGOING' ? 'En Cours' :
                 tournament.status === 'COMPLETED' ? 'Terminé' : tournament.status}
              </span>
            </div>
          </div>
        </div>

        {/* Bracket Visualizer */}
        <BracketVisualizer 
          tournament={tournament}
          matches={tournament.matches}
        />
      </div>
    </div>
  );
}
