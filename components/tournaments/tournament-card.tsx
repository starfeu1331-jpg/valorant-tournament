import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Tournament {
  id: string
  name: string
  game: string
  status: string
  startDate: Date
  maxTeams: number
  registrationOpenAt: Date
  registrationCloseAt: Date
  _count?: {
    tournamentTeams: number
  }
}

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    REGISTRATION_OPEN: 'bg-green-100 text-green-800',
    ONGOING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
  }

  const statusLabels = {
    UPCOMING: 'À venir',
    REGISTRATION_OPEN: 'Inscriptions ouvertes',
    ONGOING: 'En cours',
    COMPLETED: 'Terminé',
  }

  const registeredTeams = tournament._count?.tournamentTeams || 0

  return (
    <div className="glass-card rounded-4xl shadow-md hover:shadow-lg transition-all p-6 border border-white/20 relative group">
      <Link href={`/tournaments/${tournament.id}`} className="block">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            tournament.status === 'REGISTRATION_OPEN' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            tournament.status === 'ONGOING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            tournament.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {statusLabels[tournament.status as keyof typeof statusLabels] || tournament.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white/90">Jeu:</span>
            <span>{tournament.game}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium text-white/90">Date:</span>
            <span>{formatDate(tournament.startDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-white/90">Équipes:</span>
            <span>{registeredTeams} / {tournament.maxTeams}</span>
          </div>

          {tournament.status === 'REGISTRATION_OPEN' && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50">
                Inscriptions jusqu'au {formatDate(tournament.registrationCloseAt)}
              </p>
            </div>
          )}
        </div>
      </Link>
      
      {/* Bouton Bracket - Simple Link sans onClick */}
      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link 
          href={`/tournaments/${tournament.id}/bracket`}
          className="block px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          📊 Bracket
        </Link>
      </div>
    </div>
  )
}
