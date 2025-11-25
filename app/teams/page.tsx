import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMyTeams } from '@/lib/actions/teams'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/teams')
  }

  const teams = await getMyTeams()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes équipes</h1>
            <p className="text-gray-600 mt-1">Gérez vos équipes et inscrivez-vous aux tournois</p>
          </div>
          <Link href="/teams/create">
            <Button size="lg">Créer une équipe</Button>
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune équipe</h2>
            <p className="text-gray-600 mb-6">
              Créez votre première équipe pour participer aux tournois
            </p>
            <Link href="/teams/create">
              <Button size="lg">Créer une équipe</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                      <p className="text-primary-600 font-medium">{team.tag}</p>
                    </div>
                    {team.ownerId === session.user.id && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Capitaine
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{team.game}</p>

                  {team.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{team.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>👥 {team.players.length} joueurs</span>
                    <span>🏆 {team._count.tournamentTeams} tournois</span>
                  </div>

                  <Link href={`/teams/${team.id}`}>
                    <Button variant="outline" className="w-full">
                      Voir l'équipe
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
