'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface LiveOverlayProps {
  tournament: any
}

export default function LiveOverlay({ tournament: initialTournament }: LiveOverlayProps) {
  const [tournament, setTournament] = useState(initialTournament)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Rafraîchir les données toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/overlay/tournament/${tournament.id}`)
        if (response.ok) {
          const data = await response.json()
          setTournament(data)
        }
      } catch (error) {
        console.error('Erreur lors du rafraîchissement:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [tournament.id])

  // Mettre à jour l'heure
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Trouver le match en cours ou le prochain
  const activeMatch = tournament.matches?.find((m: any) => m.status === 'IN_PROGRESS') || 
                      tournament.matches?.find((m: any) => m.status === 'PENDING')

  return (
    <div className="min-h-screen p-8 text-white font-sans">
      {/* Header avec logo et infos tournoi */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <Image
              src="/graphisme/[1] Chartes 2025/[1] Logo/PNG/logo.png"
              alt="EVY Logo"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white drop-shadow-lg">
              {tournament.name}
            </h1>
            <p className="text-xl text-white/80 font-bold drop-shadow-md">
              {tournament.game} • {tournament.format}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white/90 drop-shadow-md">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-white/70 font-medium drop-shadow-md">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Match en cours */}
      {activeMatch && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-500/20 to-transparent border-l-4 border-red-500 px-6 py-3 mb-6">
            <h2 className="text-2xl font-black text-white drop-shadow-md">
              {activeMatch.status === 'IN_PROGRESS' ? '🔴 MATCH EN COURS' : '⏱️ PROCHAIN MATCH'}
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Équipe 1 */}
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-6xl font-black text-white mb-4 drop-shadow-xl">
                  {activeMatch.teamAScore ?? 0}
                </div>
                <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                  {activeMatch.teamA.name}
                </h3>
                <p className="text-xl text-red-400 font-bold drop-shadow-md">
                  {activeMatch.teamA.tag}
                </p>
              </div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-6xl font-black text-gradient drop-shadow-2xl animate-pulse">
                VS
              </div>
              {activeMatch.round && (
                <div className="mt-4 text-lg text-white/80 font-bold drop-shadow-md">
                  {activeMatch.round}
                </div>
              )}
            </div>

            {/* Équipe 2 */}
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-3xl p-8 transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-6xl font-black text-white mb-4 drop-shadow-xl">
                  {activeMatch.teamBScore ?? 0}
                </div>
                <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                  {activeMatch.teamB.name}
                </h3>
                <p className="text-xl text-red-400 font-bold drop-shadow-md">
                  {activeMatch.teamB.tag}
                </p>
              </div>
            </div>
          </div>

          {/* Format du match */}
          <div className="mt-6 text-center">
            <span className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-lg font-bold text-white/90 drop-shadow-lg">
              {tournament.matchFormat}
            </span>
          </div>
        </div>
      )}

      {/* Classement / Équipes restantes */}
      <div className="mt-12">
        <div className="bg-gradient-to-r from-white/10 to-transparent border-l-4 border-white/50 px-6 py-3 mb-6">
          <h2 className="text-2xl font-black text-white drop-shadow-md">
            🏆 ÉQUIPES EN COMPÉTITION ({tournament.tournamentTeams.length})
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {tournament.tournamentTeams.slice(0, 8).map((tt: any) => (
            <div
              key={tt.id}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 hover:border-red-500/50 hover:bg-white/10 transition-all"
            >
              <div className="text-center">
                <h4 className="text-lg font-black text-white mb-1 drop-shadow-md truncate">
                  {tt.team.name}
                </h4>
                <p className="text-sm text-red-400 font-bold drop-shadow-sm">
                  {tt.team.tag}
                </p>
                <p className="text-xs text-white/60 mt-2 font-medium">
                  {tt.team.players.length} joueurs
                </p>
              </div>
            </div>
          ))}
        </div>

        {tournament.tournamentTeams.length > 8 && (
          <div className="text-center mt-4">
            <span className="text-white/70 font-medium drop-shadow-md">
              +{tournament.tournamentTeams.length - 8} équipe(s) supplémentaire(s)
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-full text-sm font-bold text-red-300 drop-shadow-lg animate-pulse">
              🔴 EN DIRECT
            </span>
            <span className="text-white/70 font-medium drop-shadow-md">
              Suivez-nous sur Twitch • @EVYEsport
            </span>
          </div>
          <div className="text-white/50 text-sm font-medium drop-shadow-md">
            evy-esport.fr
          </div>
        </div>
      </div>
    </div>
  )
}
