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

  const openStaffConversations = await prisma.staffConversation.count({
    where: {
      status: 'OPEN',
    },
  })

  return (
    <div className="min-h-screen">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      {/* Header */}
      <div className="glass-card border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-display font-black text-white">Dashboard Staff</h1>
              <p className="text-white/80 mt-1">Connecté en tant que {session.user.name}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/staff/tournaments/create">
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600">Créer un tournoi</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">Retour au site</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-bold text-white/70">Tournois actifs</h3>
            <p className="text-4xl font-black text-gradient mt-2">
              {tournaments.filter(t => t.status === 'ONGOING').length}
            </p>
          </div>
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-bold text-white/70">Tournois totaux</h3>
            <p className="text-4xl font-black text-gradient mt-2">{tournaments.length}</p>
          </div>
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-bold text-white/70">Équipes en attente</h3>
            <p className="text-4xl font-black text-yellow-400 mt-2">{pendingTeams}</p>
          </div>
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-bold text-white/70">Matches à venir</h3>
            <p className="text-4xl font-black text-gradient mt-2">
              {tournaments.reduce((acc, t) => acc + t._count.matches, 0)}
            </p>
          </div>
        </div>

        {/* Messages des joueurs */}
        {openStaffConversations > 0 && (
          <div className="glass-card rounded-4xl border border-blue-500/30 bg-blue-500/5 p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-blue-300 mb-1">
                  💬 Messages des joueurs
                </h3>
                <p className="text-blue-200">
                  {openStaffConversations} conversation{openStaffConversations > 1 ? 's' : ''} en attente de réponse
                </p>
              </div>
              <Link href="/staff/messages">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600">Voir les messages</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Liste des tournois */}
        <div className="glass-card rounded-4xl border border-white/20">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-3xl font-display font-black text-white">Mes tournois</h2>
          </div>
          
          {tournaments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/70 mb-4">Aucun tournoi créé</p>
              <Link href="/staff/tournaments/create">
                <Button className="bg-gradient-to-r from-red-500 to-red-600">Créer mon premier tournoi</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{tournament.name}</h3>
                      <p className="text-white/70 mb-3">{tournament.game}</p>
                      
                      <div className="flex flex-wrap gap-6 text-sm text-white/70">
                        <span>
                          <strong className="text-white">Équipes:</strong> {tournament._count.tournamentTeams} / {tournament.maxTeams}
                        </span>
                        <span>
                          <strong className="text-white">Matches:</strong> {tournament._count.matches}
                        </span>
                        <span>
                          <strong className="text-white">Statut:</strong>{' '}
                          <span
                            className={`font-bold ${
                              tournament.status === 'ONGOING'
                                ? 'text-yellow-400'
                                : tournament.status === 'COMPLETED'
                                ? 'text-white/70'
                                : 'text-blue-400'
                            }`}
                          >
                            {tournament.status}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <Link href={`/staff/tournaments/${tournament.id}`}>
                      <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                        <span className="md:hidden">⚙️</span>
                        <span className="hidden md:inline">Gérer</span>
                      </Button>
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
