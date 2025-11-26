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
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-4xl border border-white/20 p-6 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Gestion du joueur
                </h1>
                <p className="text-white/70">{user.username}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/messages/${user.id}`}>
                  <Button className="bg-red-500 hover:bg-red-600">
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
            <div className="space-y-4 mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.username}
                    className="w-20 h-20 rounded-full"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{user.username}</h3>
                  <p className="text-sm text-white/60">ID: {user.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-white/60">Discord ID:</span>
                  <p className="text-white">{user.discordId || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Email:</span>
                  <p className="text-white">{user.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Riot ID:</span>
                  <p className="text-white">{user.riotId || 'Non configuré'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Rang Valorant:</span>
                  <p className="text-white font-bold">{user.valorantRank || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Rôle actuel:</span>
                  <p className="text-white font-bold">{user.role}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Inscrit le:</span>
                  <p className="text-white">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Équipes créées:</span>
                  <p className="text-white">{user.ownedTeams.length}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-white/60">Équipes rejointes:</span>
                  <p className="text-white">{user.teamPlayers.length}</p>
                </div>
              </div>
            </div>

            {/* Changer le rôle */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Changer le rôle</h3>
              <form action={changeRole} className="flex gap-3">
                <select
                  name="role"
                  defaultValue={user.role}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                >
                  <option value="PLAYER" className="bg-gray-900">Joueur</option>
                  <option value="STAFF" className="bg-gray-900">Staff</option>
                  <option value="ADMIN" className="bg-gray-900">Admin</option>
                </select>
                <Button type="submit">
                  Mettre à jour
                </Button>
              </form>
            </div>

            {/* Équipes */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Équipes ({user.ownedTeams.length + user.teamPlayers.length})
              </h3>
              <div className="space-y-2">
                {user.ownedTeams.map((team: any) => (
                  <Link
                    key={team.id}
                    href={`/staff/equipes/${team.id}`}
                    className="block p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{team.name}</p>
                        <p className="text-sm text-white/60">{team.game} • Propriétaire</p>
                      </div>
                      <span className="text-red-400 font-medium">{team.tag}</span>
                    </div>
                  </Link>
                ))}
                {user.teamPlayers.map((tp: any) => (
                  <Link
                    key={tp.id}
                    href={`/staff/equipes/${tp.team.id}`}
                    className="block p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-red-500/50 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{tp.team.name}</p>
                        <p className="text-sm text-white/60">{tp.team.game} • {tp.role === 'CAPTAIN' ? 'Capitaine' : 'Membre'}</p>
                      </div>
                      <span className="text-red-400 font-medium">{tp.team.tag}</span>
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
