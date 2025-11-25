import { notFound } from 'next/navigation'
import { getTournamentById } from '@/lib/actions/tournaments'
import { formatDate, formatDateShort } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function TournamentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const tournament = await getTournamentById(params.id)
  const session = await getServerSession(authOptions)

  if (!tournament) {
    notFound()
  }

  const acceptedTeams = tournament.tournamentTeams.filter(tt => tt.status === 'ACCEPTED')
  const canRegister = tournament.status === 'REGISTRATION_OPEN' && session

  // Vérifier si l'utilisateur a une équipe inscrite à ce tournoi
  let userTeamRegistration = null
  if (session) {
    userTeamRegistration = tournament.tournamentTeams.find(tt => 
      tt.team.ownerId === session.user.id || 
      tt.team.players.some(p => p.userId === session.user.id)
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
              <p className="text-gray-600 text-lg">{tournament.game}</p>
            </div>
            {canRegister && !userTeamRegistration && (
              <Link href={`/tournaments/${tournament.id}/register`}>
                <Button size="lg">Inscrire mon équipe</Button>
              </Link>
            )}
          </div>

          {/* Statut de l'inscription de l'utilisateur */}
          {userTeamRegistration && (
            <div className={`mt-6 p-4 rounded-lg border-2 ${
              userTeamRegistration.status === 'ACCEPTED' 
                ? 'bg-green-50 border-green-300'
                : userTeamRegistration.status === 'PENDING'
                ? 'bg-blue-50 border-blue-300'
                : userTeamRegistration.status === 'WITHDRAW_REQUESTED'
                ? 'bg-orange-50 border-orange-300'
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">
                    {userTeamRegistration.status === 'ACCEPTED' ? '✅' : 
                     userTeamRegistration.status === 'PENDING' ? '⏳' :
                     userTeamRegistration.status === 'WITHDRAW_REQUESTED' ? '📤' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      userTeamRegistration.status === 'ACCEPTED' ? 'text-green-800' :
                      userTeamRegistration.status === 'PENDING' ? 'text-blue-800' :
                      userTeamRegistration.status === 'WITHDRAW_REQUESTED' ? 'text-orange-800' :
                      'text-red-800'
                    }`}>
                      {userTeamRegistration.status === 'ACCEPTED' && 'Votre équipe est inscrite !'}
                      {userTeamRegistration.status === 'PENDING' && 'Votre équipe est en attente de validation'}
                      {userTeamRegistration.status === 'WITHDRAW_REQUESTED' && 'Demande de retrait en cours'}
                      {userTeamRegistration.status === 'REJECTED' && 'Votre inscription a été refusée'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      userTeamRegistration.status === 'ACCEPTED' ? 'text-green-700' :
                      userTeamRegistration.status === 'PENDING' ? 'text-blue-700' :
                      userTeamRegistration.status === 'WITHDRAW_REQUESTED' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {userTeamRegistration.status === 'ACCEPTED' && 
                        `L'équipe ${userTeamRegistration.team.name} [${userTeamRegistration.team.tag}] participe au tournoi`}
                      {userTeamRegistration.status === 'PENDING' && 
                        `L'équipe ${userTeamRegistration.team.name} [${userTeamRegistration.team.tag}] est en cours de validation par les bénévoles. Vous serez notifié dès que votre inscription sera approuvée.`}
                      {userTeamRegistration.status === 'WITHDRAW_REQUESTED' && 
                        `Votre demande de retrait pour l'équipe ${userTeamRegistration.team.name} est en attente de traitement par le staff.`}
                      {userTeamRegistration.status === 'REJECTED' && userTeamRegistration.rejectionReason}
                    </p>
                  </div>
                </div>
                <Link href={`/teams/${userTeamRegistration.team.id}`}>
                  <Button variant="outline">
                    Voir mon équipe
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Statut</h3>
              <p className="text-lg font-semibold">{tournament.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Format</h3>
              <p className="text-lg">{tournament.format} - {tournament.matchFormat}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Équipes</h3>
              <p className="text-lg">{acceptedTeams.length} / {tournament.maxTeams}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Début du tournoi</h3>
              <p className="text-lg">{formatDate(tournament.startDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Inscriptions</h3>
              <p className="text-lg">
                Du {formatDateShort(tournament.registrationOpenAt)} au{' '}
                {formatDateShort(tournament.registrationCloseAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Description et règles */}
        {(tournament.description || tournament.rules) && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            {tournament.description && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Règlement</h2>
                <p className="text-gray-700 whitespace-pre-line">{tournament.rules}</p>
              </div>
            )}
          </div>
        )}

        {/* Équipes inscrites */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Équipes inscrites ({acceptedTeams.length})</h2>

          {acceptedTeams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucune équipe inscrite pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedTeams.map(tt => (
                <div key={tt.id} className="border rounded-lg p-4 hover:border-primary-600 transition-colors">
                  <div className="flex items-center gap-4">
                    {tt.team.logo && (
                      <img
                        src={tt.team.logo}
                        alt={tt.team.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold">{tt.team.name}</h3>
                      <p className="text-sm text-gray-600">[{tt.team.tag}]</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bracket */}
        {tournament.matches.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Bracket & Matches</h2>
            
            <div className="space-y-6">
              {Array.from(new Set(tournament.matches.map(m => m.round))).map(round => (
                <div key={round}>
                  <h3 className="text-xl font-semibold mb-4">{round}</h3>
                  <div className="space-y-3">
                    {tournament.matches
                      .filter(m => m.round === round)
                      .map(match => (
                        <div
                          key={match.id}
                          className="border rounded-lg p-4 flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                            </p>
                            {match.scheduledAt && (
                              <p className="text-sm text-gray-600">
                                {formatDate(match.scheduledAt)}
                              </p>
                            )}
                          </div>
                          
                          {match.status === 'COMPLETED' && (
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {match.scoreTeamA} - {match.scoreTeamB}
                              </p>
                            </div>
                          )}
                          
                          <span
                            className={`px-3 py-1 rounded-full text-xs ml-4 ${
                              match.status === 'COMPLETED'
                                ? 'bg-gray-100 text-gray-800'
                                : match.status === 'ONGOING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {match.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
