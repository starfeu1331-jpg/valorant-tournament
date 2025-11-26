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
    <div className="min-h-screen py-12">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* En-tête */}
        <div className="glass-card rounded-4xl p-8 mb-8 border border-white/20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-display font-black text-white mb-2">{tournament.name}</h1>
              <p className="text-white/70 text-lg">{tournament.game}</p>
            </div>
            {canRegister && !userTeamRegistration && (
              <Link href={`/tournaments/${tournament.id}/register`}>
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  Inscrire mon équipe
                </Button>
              </Link>
            )}
          </div>

          {/* Statut de l'inscription de l'utilisateur */}
          {userTeamRegistration && (
            <div className={`mt-6 p-4 rounded-2xl border-2 backdrop-blur-sm ${
              userTeamRegistration.status === 'ACCEPTED' 
                ? 'bg-green-500/10 border-green-500/30'
                : userTeamRegistration.status === 'PENDING'
                ? 'bg-blue-500/10 border-blue-500/30'
                : userTeamRegistration.status === 'WITHDRAW_REQUESTED'
                ? 'bg-orange-500/10 border-orange-500/30'
                : userTeamRegistration.status === 'REMOVED'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">
                    {userTeamRegistration.status === 'ACCEPTED' ? '✅' : 
                     userTeamRegistration.status === 'PENDING' ? '⏳' :
                     userTeamRegistration.status === 'WITHDRAW_REQUESTED' ? '📤' :
                     userTeamRegistration.status === 'REMOVED' ? '⚠️' : '❌'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      userTeamRegistration.status === 'ACCEPTED' ? 'text-green-400' :
                      userTeamRegistration.status === 'PENDING' ? 'text-blue-400' :
                      userTeamRegistration.status === 'WITHDRAW_REQUESTED' ? 'text-orange-400' :
                      userTeamRegistration.status === 'REMOVED' ? 'text-orange-400' :
                      'text-red-400'
                    }`}>
                      {userTeamRegistration.status === 'ACCEPTED' && 'Votre équipe est inscrite !'}
                      {userTeamRegistration.status === 'PENDING' && 'Votre équipe est en attente de validation'}
                      {userTeamRegistration.status === 'WITHDRAW_REQUESTED' && 'Demande de retrait en cours'}
                      {userTeamRegistration.status === 'REMOVED' && 'Votre équipe a été retirée du tournoi'}
                      {userTeamRegistration.status === 'REJECTED' && 'Votre inscription a été refusée'}
                    </h3>
                    <p className="text-white/70 text-sm mt-1">
                      {userTeamRegistration.status === 'ACCEPTED' && 
                        `L'équipe ${userTeamRegistration.team.name} [${userTeamRegistration.team.tag}] participe au tournoi`}
                      {userTeamRegistration.status === 'PENDING' && 
                        `L'équipe ${userTeamRegistration.team.name} [${userTeamRegistration.team.tag}] est en cours de validation par les bénévoles. Vous serez notifié dès que votre inscription sera approuvée.`}
                      {userTeamRegistration.status === 'WITHDRAW_REQUESTED' && 
                        `Votre demande de retrait pour l'équipe ${userTeamRegistration.team.name} est en attente de traitement par le staff.`}
                      {userTeamRegistration.status === 'REMOVED' && (
                        <>
                          <span className="font-medium">Raison du retrait :</span>{' '}
                          {userTeamRegistration.rejectionReason || 'Aucune raison spécifiée. Contactez le staff pour plus d\'informations.'}
                        </>
                      )}
                      {userTeamRegistration.status === 'REJECTED' && (
                        <>
                          <span className="font-medium">Raison du refus :</span>{' '}
                          {userTeamRegistration.rejectionReason || 'Aucune raison spécifiée. Contactez le staff pour plus d\'informations.'}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Link href={`/teams/${userTeamRegistration.team.id}`}>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Voir mon équipe
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-1">Statut</h3>
              <p className="text-lg font-semibold text-white">{tournament.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-1">Format</h3>
              <p className="text-lg text-white">{tournament.format} - {tournament.matchFormat}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-1">Équipes</h3>
              <p className="text-lg text-white">{acceptedTeams.length} / {tournament.maxTeams}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-1">Début du tournoi</h3>
              <p className="text-lg text-white">{formatDate(tournament.startDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-1">Inscriptions</h3>
              <p className="text-lg text-white">
                Du {formatDateShort(tournament.registrationOpenAt)} au{' '}
                {formatDateShort(tournament.registrationCloseAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Description et règles */}
        {(tournament.description || tournament.rules) && (
          <div className="glass-card rounded-4xl p-8 mb-8 border border-white/20">
            {tournament.description && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
                <p className="text-white/80 whitespace-pre-line">{tournament.description}</p>
              </div>
            )}

            {tournament.rules && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Règlement</h2>
                <div className="text-white/80 prose prose-invert max-w-none whitespace-pre-line">
                  {tournament.rules}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Équipes inscrites */}
        <div className="glass-card rounded-4xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Équipes inscrites ({acceptedTeams.length})</h2>

          {acceptedTeams.length === 0 ? (
            <p className="text-white/60 text-center py-8">
              Aucune équipe inscrite pour le moment
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedTeams.map(tt => (
                <div key={tt.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-red-500/50 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    {tt.team.logo && (
                      <img
                        src={tt.team.logo}
                        alt={tt.team.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-white">{tt.team.name}</h3>
                      <p className="text-sm text-white/60">[{tt.team.tag}]</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bracket */}
        {tournament.matches.length > 0 && (
          <div className="glass-card rounded-4xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Bracket & Matches</h2>
            
            <div className="space-y-6">
              {Array.from(new Set(tournament.matches.map(m => m.round))).map(round => (
                <div key={round}>
                  <h3 className="text-xl font-semibold text-white mb-4">{round}</h3>
                  <div className="space-y-3">
                    {tournament.matches
                      .filter(m => m.round === round)
                      .map(match => (
                        <div
                          key={match.id}
                          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:bg-white/10 transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                            </p>
                            {match.scheduledAt && (
                              <p className="text-sm text-white/60">
                                {formatDate(match.scheduledAt)}
                              </p>
                            )}
                          </div>
                          
                          {match.status === 'COMPLETED' && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-white">
                                {match.scoreTeamA} - {match.scoreTeamB}
                              </p>
                            </div>
                          )}
                          
                          <span
                            className={`px-3 py-1 rounded-full text-xs ml-4 font-medium ${
                              match.status === 'COMPLETED'
                                ? 'bg-white/10 text-white/80'
                                : match.status === 'ONGOING'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
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
