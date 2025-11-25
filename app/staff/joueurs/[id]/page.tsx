import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'

export default async function StaffPlayerManagePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      ownedTeams: {
        include: {
          _count: {
            select: {
              players: true,
            },
          },
        },
      },
      teamPlayers: {
        include: {
          team: true,
        },
      },
      _count: {
        select: {
          staffActions: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  async function changeRole(formData: FormData) {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return
    
    const newRole = formData.get('role') as string
    await prisma.user.update({
      where: { id: params.id },
      data: { role: newRole },
    })
    
    await prisma.staffActionLog.create({
      data: {
        staffId: session.user.id,
        actionType: 'ROLE_CHANGE',
        resourceType: 'USER',
        resourceId: params.id,
        description: `Role changed to ${newRole}`,
      },
    })
    
    revalidatePath(`/staff/joueurs/${params.id}`)
    revalidatePath(`/joueurs/${params.id}`)
  }

  async function deleteUser() {
    'use server'
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return
    
    await prisma.staffActionLog.create({
      data: {
        staffId: session.user.id,
        actionType: 'DELETE_USER',
        resourceType: 'USER',
        resourceId: params.id,
        description: `User ${user.username} deleted`,
      },
    })
    
    await prisma.user.delete({
      where: { id: params.id },
    })
    
    revalidatePath('/joueurs')
    redirect('/joueurs')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestion du joueur
                </h1>
                <p className="text-gray-600">{user.username}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/messages/${user.id}`}>
                  <Button className="bg-primary-600 hover:bg-primary-700">
                    💬 Contacter
                  </Button>
                </Link>
                <Link href={`/joueurs/${user.id}`}>
                  <Button variant="outline">Voir public</Button>
                </Link>
                <Link href="/joueurs">
                  <Button variant="outline">Retour</Button>
                </Link>
              </div>
            </div>

            {/* Informations complètes */}
            <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.username}
                    className="w-20 h-20 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
                  <p className="text-sm text-gray-600">ID: {user.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Discord ID:</span>
                  <p className="text-gray-900">{user.discordId || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{user.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Riot ID:</span>
                  <p className="text-gray-900">{user.riotId || 'Non configuré'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Rang Valorant:</span>
                  <p className="text-gray-900 font-bold">{user.valorantRank || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Rôle actuel:</span>
                  <p className="text-gray-900 font-bold">{user.role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Inscrit le:</span>
                  <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Équipes créées:</span>
                  <p className="text-gray-900">{user.ownedTeams.length}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Équipes rejointes:</span>
                  <p className="text-gray-900">{user.teamPlayers.length}</p>
                </div>
              </div>
            </div>

            {/* Changer le rôle */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Changer le rôle</h3>
              <form action={changeRole} className="flex gap-3">
                <select
                  name="role"
                  defaultValue={user.role}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PLAYER">Joueur</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <Button type="submit">
                  Mettre à jour
                </Button>
              </form>
            </div>

            {/* Équipes */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Équipes ({user.ownedTeams.length + user.teamPlayers.length})
              </h3>
              <div className="space-y-2">
                {user.ownedTeams.map((team: any) => (
                  <Link
                    key={team.id}
                    href={`/staff/equipes/${team.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{team.name}</p>
                        <p className="text-sm text-gray-600">{team.game} • Propriétaire</p>
                      </div>
                      <span className="text-primary-600 font-medium">{team.tag}</span>
                    </div>
                  </Link>
                ))}
                {user.teamPlayers.map((tp: any) => (
                  <Link
                    key={tp.id}
                    href={`/staff/equipes/${tp.team.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{tp.team.name}</p>
                        <p className="text-sm text-gray-600">{tp.team.game} • {tp.role === 'CAPTAIN' ? 'Capitaine' : 'Membre'}</p>
                      </div>
                      <span className="text-primary-600 font-medium">{tp.team.tag}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Actions dangereuses */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-red-600 mb-4">Zone de danger</h3>
              <form action={deleteUser}>
                <Button type="submit" variant="outline" className="w-full bg-red-50 border-red-300 text-red-700 hover:bg-red-100">
                  🗑️ Supprimer définitivement ce compte
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
