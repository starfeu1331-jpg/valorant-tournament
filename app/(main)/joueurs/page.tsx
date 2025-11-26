import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PublicPlayersPage({
  searchParams,
}: {
  searchParams: { search?: string; role?: string }
}) {
  const search = searchParams.search || ''
  const roleFilter = searchParams.role || ''

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              username: { contains: search, mode: 'insensitive' },
            }
          : {},
        roleFilter ? { role: roleFilter as any } : {},
      ],
    },
    include: {
      _count: {
        select: {
          ownedTeams: true,
          teamPlayers: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="glass-card rounded-4xl p-8 md:p-12 border border-white/20 mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-3">Tous les joueurs</h1>
          <p className="text-white/80 text-lg">Parcourez tous les joueurs inscrits sur la plateforme</p>
        </div>

        {/* Filtres */}
        <form method="GET" className="glass-card rounded-4xl border border-white/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-bold text-white mb-2">
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Nom d'utilisateur..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-bold text-white mb-2">
                Rôle
              </label>
              <select
                id="role"
                name="role"
                defaultValue={roleFilter}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
              >
                <option value="" className="bg-gray-900">Tous les rôles</option>
                <option value="PLAYER" className="bg-gray-900">Joueur</option>
                <option value="STAFF" className="bg-gray-900">Staff</option>
                <option value="ADMIN" className="bg-gray-900">Admin</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="flex-1">
                Rechercher
              </Button>
              <Link href="/joueurs" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Réinitialiser
                </Button>
              </Link>
            </div>
          </div>
        </form>

        {/* Résultats */}
        <div className="mb-4 text-sm font-medium text-white/70">
          {users.length} joueur{users.length > 1 ? 's' : ''} trouvé{users.length > 1 ? 's' : ''}
        </div>

        {users.length === 0 ? (
          <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-display font-black text-white mb-2">Aucun joueur trouvé</h2>
            <p className="text-white/70">Essayez avec d'autres critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user: any) => (
              <Link
                key={user.id}
                href={`/joueurs/${user.id}`}
                className="glass-card rounded-3xl border border-white/20 hover:border-red-500/50 transition-all card-hover p-6"
              >
                <div className="flex flex-col items-center">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.username}
                      className="w-20 h-20 rounded-full mb-4 border-2 border-white/20"
                    />
                  )}
                  <h3 className="text-lg font-bold text-white text-center mb-2">
                    {user.username}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                      user.role === 'ADMIN'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : user.role === 'STAFF'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-white/10 text-white/80 border border-white/20'
                    }`}
                  >
                    {user.role === 'ADMIN' ? '👑 Admin' : user.role === 'STAFF' ? '⚙️ Staff' : '🎮 Joueur'}
                  </span>
                  <div className="flex gap-4 text-sm text-white/70">
                    <span>🏆 {user._count.ownedTeams} équipes</span>
                    <span>👥 {user._count.teamPlayers} teams</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
