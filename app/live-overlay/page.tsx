'use client'



import { useState, useEffect } from 'react';
import BracketVisualizer from '@/components/tournaments/bracket-visualizer';

export default function LiveOverlayPage() {
  const [tournament, setTournament] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await fetch('/api/overlay/tournaments/active' + (window.location.search || ''))
        if (res.ok) {
          const data = await res.json()
          setTournament(data)
        }
      } catch (error) {
        console.error('Error fetching tournament:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTournament()
    const interval = setInterval(fetchTournament, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return null
  if (!tournament) return null

  // BracketVisualizer expects matches and tournament
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="w-full h-full pointer-events-none">
        <BracketVisualizer
          tournament={{
            id: tournament.id,
            name: tournament.name,
            maxTeams: tournament.maxTeams,
            status: tournament.status,
          }}
          matches={tournament.matches?.map((m: any) => ({
            id: m.id,
            matchNumber: m.matchNumber,
            round: m.round,
            status: m.status === 'IN_PROGRESS' ? 'ONGOING' : m.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
            teamA: m.teamA ? {
              id: m.teamA.id,
              name: m.teamA.name,
              tag: m.teamA.tag || '',
            } : null,
            teamB: m.teamB ? {
              id: m.teamB.id,
              name: m.teamB.name,
              tag: m.teamB.tag || '',
            } : null,
            teamAScore: m.scoreTeamA ?? m.teamAScore ?? 0,
            teamBScore: m.scoreTeamB ?? m.teamBScore ?? 0,
            winnerId: m.winnerId || null,
            scheduledFor: m.scheduledFor || null,
          })) || []}
        />
      </div>
    </div>
  )
}
