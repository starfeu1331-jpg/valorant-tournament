import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/')
  }

  const tournaments = await prisma.tournament.findMany({
    include: {
      _count: {
        select: {
          tournamentTeams: true,
          matches: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const pendingTeams = await prisma.tournamentTeam.count({
    where: {
      status: 'PENDING',
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Staff</h1>
              <p className="text-gray-600 mt-1">Connecté en tant que {session.user.name}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/staff/tournaments/create">
                <Button size="lg">Créer un tournoi</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Retour au site</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Tournois actifs</h3>
            <p className="text-3xl font-bold mt-2">
              {tournaments.filter(t => t.status === 'ONGOING').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Tournois totaux</h3>
            <p className="text-3xl font-bold mt-2">{tournaments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Équipes en attente</h3>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{pendingTeams}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Matches à venir</h3>
            <p className="text-3xl font-bold mt-2">
              {tournaments.reduce((acc, t) => acc + t._count.matches, 0)}
            </p>
          </div>
        </div>

        {/* Liste des tournois */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Mes tournois</h2>
          </div>
          
          {tournaments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">Aucun tournoi créé</p>
              <Link href="/staff/tournaments/create">
                <Button>Créer mon premier tournoi</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{tournament.name}</h3>
                      <p className="text-gray-600 mb-3">{tournament.game}</p>
                      
                      <div className="flex gap-6 text-sm text-gray-600">
                        <span>
                          <strong>Équipes:</strong> {tournament._count.tournamentTeams} / {tournament.maxTeams}
                        </span>
                        <span>
                          <strong>Matches:</strong> {tournament._count.matches}
                        </span>
                        <span>
                          <strong>Statut:</strong>{' '}
                          <span
                            className={`font-medium ${
                              tournament.status === 'ONGOING'
                                ? 'text-yellow-600'
                                : tournament.status === 'COMPLETED'
                                ? 'text-gray-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {tournament.status}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <Link href={`/staff/tournaments/${tournament.id}`}>
                      <Button variant="outline">Gérer</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
