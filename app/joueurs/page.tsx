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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tous les joueurs</h1>
          <p className="text-gray-600 mt-1">Parcourez tous les joueurs inscrits sur la plateforme</p>
        </div>

        {/* Filtres */}
        <form method="GET" className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-900 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Nom d'utilisateur..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-900 mb-2">
                Rôle
              </label>
              <select
                id="role"
                name="role"
                defaultValue={roleFilter}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tous les rôles</option>
                <option value="PLAYER">Joueur</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
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
        <div className="mb-4 text-sm text-gray-600">
          {users.length} joueur{users.length > 1 ? 's' : ''} trouvé{users.length > 1 ? 's' : ''}
        </div>

        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun joueur trouvé</h2>
            <p className="text-gray-600">Essayez avec d'autres critères de recherche</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((user: any) => (
              <Link
                key={user.id}
                href={`/joueurs/${user.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex flex-col items-center">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.username}
                      className="w-20 h-20 rounded-full mb-4"
                    />
                  )}
                  <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                    {user.username}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'STAFF'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.role === 'ADMIN' ? '👑 Admin' : user.role === 'STAFF' ? '⚙️ Staff' : '🎮 Joueur'}
                  </span>
                  <div className="flex gap-4 text-sm text-gray-600">
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
