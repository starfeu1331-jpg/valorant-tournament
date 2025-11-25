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
    <Link href={`/tournaments/${tournament.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">{tournament.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[tournament.status as keyof typeof statusColors] || 'bg-gray-100'}`}>
            {statusLabels[tournament.status as keyof typeof statusLabels] || tournament.status}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Jeu:</span>
            <span>{tournament.game}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-medium">Date:</span>
            <span>{formatDate(tournament.startDate)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Équipes:</span>
            <span>{registeredTeams} / {tournament.maxTeams}</span>
          </div>

          {tournament.status === 'REGISTRATION_OPEN' && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500">
                Inscriptions jusqu'au {formatDate(tournament.registrationCloseAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
