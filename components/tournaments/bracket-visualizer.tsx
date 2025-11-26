"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
  tag: string;
}

interface Match {
  id: string;
  matchNumber: number;
  round: string;
  status: string;
  teamA: Team | null;
  teamB: Team | null;
  teamAScore: number | null;
  teamBScore: number | null;
  winnerId: string | null;
  scheduledFor: Date | null;
}

interface Tournament {
  id: string;
  name: string;
  maxTeams: number;
  status: string;
}

interface BracketVisualizerProps {
  tournament: Tournament;
  matches: Match[];
}

export default function BracketVisualizer({ tournament, matches }: BracketVisualizerProps) {
  const router = useRouter();

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  // Organize matches by round
  const quarterFinals = matches.filter(m => m.round === "Quarts de finale").sort((a, b) => a.matchNumber - b.matchNumber);
  const semiFinals = matches.filter(m => m.round === "Demi-finale").sort((a, b) => a.matchNumber - b.matchNumber);
  const finals = matches.filter(m => m.round === "Finale");

  const finalMatch = finals[0];

  // Helper to render a team in bracket
  const renderTeam = (team: Team | null, score: number | null, isWinner: boolean, position: 'top' | 'bottom') => {
    return (
      <div className={`relative flex items-center justify-between px-4 py-2.5 transition-all ${
        team 
          ? isWinner 
            ? 'bg-gradient-to-r from-yellow-500/40 to-yellow-600/40 border-2 border-yellow-400' 
            : 'bg-gray-800/80 border-2 border-white/30'
          : 'bg-gray-900/50 border-2 border-white/10 border-dashed'
      } ${position === 'top' ? 'rounded-t-lg' : 'rounded-b-lg'}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {team ? (
            <>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {team.tag.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <div className={`font-bold text-sm truncate ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                  {team.name}
                </div>
                <div className="text-xs text-white/50 truncate">{team.tag}</div>
              </div>
            </>
          ) : (
            <div className="text-white/30 text-xs italic">TBD</div>
          )}
        </div>
        {team && score !== null && (
          <div className={`text-xl font-black ml-2 ${isWinner ? 'text-yellow-300' : 'text-white/70'}`}>
            {score}
          </div>
        )}
      </div>
    );
  };

  // Helper to render a match block
  const renderMatchBlock = (match: Match, roundName: string) => {
    return (
      <div className="relative w-64">
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20">
          {/* Match header */}
          <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-xs font-bold text-white/70">{roundName} #{match.matchNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              match.status === 'COMPLETED' ? 'bg-green-500/30 text-green-400' :
              match.status === 'ONGOING' ? 'bg-yellow-500/30 text-yellow-400' :
              'bg-blue-500/30 text-blue-400'
            }`}>
              {match.status === 'COMPLETED' ? '✓' :
               match.status === 'ONGOING' ? '⚡' : '⏰'}
            </span>
          </div>
          
          {/* Teams */}
          <div>
            {renderTeam(match.teamA, match.teamAScore, match.winnerId === match.teamA?.id, 'top')}
            {renderTeam(match.teamB, match.teamBScore, match.winnerId === match.teamB?.id, 'bottom')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="min-w-max">
        {/* Bracket Grid - Layout symétrique */}
        <div className="flex gap-16 items-center justify-center px-8 py-12">
          
          {/* CÔTÉ GAUCHE - Quarts de finale (2 premiers matchs) */}
          {quarterFinals.length > 0 && (
            <div className="relative">
              <h3 className="text-center text-sm font-black text-white/70 mb-6 uppercase tracking-wider">
                Quarts de finale
              </h3>
              <div className="flex flex-col gap-32">
                {quarterFinals.slice(0, 2).map((match, index) => (
                  <div key={match.id} className="relative">
                    {renderMatchBlock(match, "QF")}
                    {/* Ligne horizontale vers la demi-finale */}
                    <div className="absolute top-1/2 -right-16 w-16 h-0.5 bg-white/20" style={{ transform: 'translateY(-50%)' }}></div>
                  </div>
                ))}
                {/* Ligne verticale connectant les 2 matchs du haut */}
                <div className="absolute top-1/4 -right-16 w-0.5 bg-white/20" style={{ 
                  height: `${16 * 16 + 128}px`,
                  left: 'calc(100% + 64px)',
                }}></div>
              </div>
            </div>
          )}

          {/* DEMI-FINALE GAUCHE */}
          {semiFinals.length > 0 && semiFinals[0] && (
            <div className="relative" style={{ marginTop: `${8 * 16}px` }}>
              <h3 className="text-center text-sm font-black text-white/70 mb-6 uppercase tracking-wider">
                Demi-finale
              </h3>
              <div className="relative">
                {renderMatchBlock(semiFinals[0], "DF")}
                {/* Ligne vers la finale */}
                <div className="absolute top-1/2 -right-16 w-16 h-0.5 bg-white/20" style={{ transform: 'translateY(-50%)' }}></div>
              </div>
            </div>
          )}

          {/* FINALE AU CENTRE */}
          {finalMatch && (
            <div className="relative" style={{ marginTop: `${8 * 16}px` }}>
              <h3 className="text-center text-sm font-black text-white/70 mb-6 uppercase tracking-wider">
                🏆 Finale
              </h3>
              <div className="relative">
                {renderMatchBlock(finalMatch, "F")}
                
                {/* Champion Badge */}
                {finalMatch.status === 'COMPLETED' && finalMatch.winnerId && (
                  <div className="absolute -right-80 top-1/2 -translate-y-1/2 w-72">
                    <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500/50 rounded-xl p-6 text-center animate-pulse">
                      <div className="text-xs text-yellow-300 font-bold mb-2">🏆 CHAMPION 🏆</div>
                      <div className="text-2xl font-black text-white mb-1">
                        {finalMatch.winnerId === finalMatch.teamA?.id ? finalMatch.teamA.name : finalMatch.teamB?.name}
                      </div>
                      <div className="text-sm text-white/70">
                        {finalMatch.winnerId === finalMatch.teamA?.id ? finalMatch.teamA.tag : finalMatch.teamB?.tag}
                      </div>
                    </div>
                    {/* Ligne vers le champion */}
                    <div className="absolute top-1/2 -left-16 w-16 h-0.5 bg-yellow-500/50" style={{ transform: 'translateY(-50%)' }}></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEMI-FINALE DROITE */}
          {semiFinals.length > 1 && semiFinals[1] && (
            <div className="relative" style={{ marginTop: `${8 * 16}px` }}>
              <h3 className="text-center text-sm font-black text-white/70 mb-6 uppercase tracking-wider">
                Demi-finale
              </h3>
              <div className="relative">
                {renderMatchBlock(semiFinals[1], "DF")}
                {/* Ligne depuis la finale */}
                <div className="absolute top-1/2 -left-16 w-16 h-0.5 bg-white/20" style={{ transform: 'translateY(-50%)' }}></div>
              </div>
            </div>
          )}

          {/* CÔTÉ DROIT - Quarts de finale (2 derniers matchs) */}
          {quarterFinals.length > 2 && (
            <div className="relative">
              <h3 className="text-center text-sm font-black text-white/70 mb-6 uppercase tracking-wider">
                Quarts de finale
              </h3>
              <div className="flex flex-col gap-32">
                {quarterFinals.slice(2, 4).map((match, index) => (
                  <div key={match.id} className="relative">
                    {renderMatchBlock(match, "QF")}
                    {/* Ligne horizontale depuis la demi-finale */}
                    <div className="absolute top-1/2 -left-16 w-16 h-0.5 bg-white/20" style={{ transform: 'translateY(-50%)' }}></div>
                  </div>
                ))}
                {/* Ligne verticale connectant les 2 matchs du bas */}
                <div className="absolute top-1/4 -left-16 w-0.5 bg-white/20" style={{ 
                  height: `${16 * 16 + 128}px`,
                  right: 'calc(100% + 64px)',
                }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-12 flex gap-8 justify-center text-sm border-t border-white/10 pt-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50"></div>
            <span className="text-white/70">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
            <span className="text-white/70">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500/50"></div>
            <span className="text-white/70">À venir</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/40 border-2 border-yellow-400"></div>
            <span className="text-white/70">Vainqueur</span>
          </div>
        </div>
      </div>
    </div>
  );
}
