import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getMyTeams, registerTeamToTournament } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function RegisterTeamPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/tournaments/${params.id}/register`)
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: params.id },
  })

  if (!tournament) {
    notFound()
  }

  if (tournament.status !== 'REGISTRATION_OPEN') {
    redirect(`/tournaments/${params.id}`)
  }

  const myTeams = await getMyTeams()
  const eligibleTeams = myTeams.filter((team: any) => team.game === tournament.game)

  // Vérifier les équipes déjà inscrites
  const registeredTeamIds = await prisma.tournamentTeam.findMany({
    where: {
      tournamentId: params.id,
      teamId: {
        in: eligibleTeams.map((t: any) => t.id),
      },
    },
    select: {
      teamId: true,
    },
  })

  const registeredIds = new Set(registeredTeamIds.map((rt: any) => rt.teamId))
  const availableTeams = eligibleTeams.filter((team: any) => !registeredIds.has(team.id))

  async function handleRegister(formData: FormData) {
    'use server'
    const teamId = formData.get('teamId') as string
    
    if (!teamId) {
      throw new Error('Équipe non sélectionnée')
    }

    await registerTeamToTournament(params.id, teamId)
    redirect(`/tournaments/${params.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Inscrire une équipe</h1>
            <p className="text-gray-600 mt-1">
              Tournoi : <strong>{tournament.name}</strong>
            </p>
          </div>

          {availableTeams.length === 0 && eligibleTeams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Aucune équipe {tournament.game}
              </h2>
              <p className="text-gray-600 mb-6">
                Vous devez créer une équipe {tournament.game} pour vous inscrire à ce tournoi
              </p>
              <Link href="/teams/create">
                <Button size="lg">
                  Créer une équipe
                </Button>
              </Link>
            </div>
          ) : availableTeams.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Toutes vos équipes sont déjà inscrites
              </h2>
              <p className="text-gray-600 mb-6">
                Vous avez déjà inscrit toutes vos équipes {tournament.game} à ce tournoi
              </p>
              <Link href={`/tournaments/${params.id}`}>
                <Button size="lg">
                  Retour au tournoi
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <form action={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4">
                    Sélectionnez votre équipe
                  </label>
                  <div className="space-y-3">
                    {availableTeams.map((team: any) => (
                      <label
                        key={team.id}
                        className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="teamId"
                          value={team.id}
                          required
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                            <span className="text-primary-600 font-medium">{team.tag}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {team.players.length} joueurs • {team._count.tournamentTeams} tournois
                          </p>
                          {team.ownerId === session.user.id && (
                            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              Vous êtes capitaine
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note :</strong> Votre inscription sera en attente de validation par les organisateurs.
                    Vous recevrez une notification une fois votre équipe validée.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg" className="flex-1">
                    Inscrire l'équipe
                  </Button>
                  <Link href={`/tournaments/${params.id}`} className="flex-1">
                    <Button type="button" variant="outline" size="lg" className="w-full">
                      Annuler
                    </Button>
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
