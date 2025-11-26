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
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card rounded-4xl p-8 md:p-12 border border-white/20 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2">Mes équipes</h1>
              <p className="text-white/80 text-lg">Gérez vos équipes et inscrivez-vous aux tournois</p>
            </div>
            <Link href="/teams/create">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg">Créer une équipe</Button>
            </Link>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-display font-black text-white mb-2">Aucune équipe</h2>
            <p className="text-white/70 mb-6">
              Créez votre première équipe pour participer aux tournois
            </p>
            <Link href="/teams/create">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-red-600">Créer une équipe</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div key={team.id} className="glass-card rounded-3xl border border-white/20 hover:border-red-500/50 transition-all card-hover">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{team.name}</h3>
                      <p className="text-red-400 font-bold">{team.tag}</p>
                    </div>
                    {team.ownerId === session.user.id && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded border border-yellow-500/30">
                        Capitaine
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-white/70 mb-4">{team.game}</p>

                  {team.description && (
                    <p className="text-sm text-white/80 mb-4 line-clamp-2">{team.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-white/70 mb-4 pb-4 border-b border-white/10">
                    <span>👥 {team.players.length} joueurs</span>
                    <span>🏆 {team._count.tournamentTeams} tournois</span>
                  </div>

                  <Link href={`/teams/${team.id}`}>
                    <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
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
