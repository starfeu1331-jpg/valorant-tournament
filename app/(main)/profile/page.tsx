import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { updateValorantRank, refreshValorantRank } from '@/lib/actions/valorant'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/profile')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  async function saveRiotId(formData: FormData) {
    'use server'
    const riotId = formData.get('riotId') as string
    
    if (!riotId) {
      throw new Error('Riot ID requis')
    }

    // Valider et récupérer le rang
    await updateValorantRank(riotId)
    
    revalidatePath('/profile')
  }

  async function refreshRank() {
    'use server'
    await refreshValorantRank()
    revalidatePath('/profile')
  }

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-red-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-4xl border border-white/20 p-8 md:p-12 mb-6">
            <h1 className="text-4xl font-display font-black text-white mb-6">Mon profil</h1>

            {/* Info Discord */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Informations Discord</h2>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                {user?.image && (
                  <img src={user.image} alt={user.username} className="w-16 h-16 rounded-full border-2 border-white/20" />
                )}
                <div>
                  <p className="font-bold text-white">{user?.username}</p>
                  <p className="text-sm text-white/70">Discord ID: {user?.discordId}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${
                      user?.role === 'ADMIN'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : user?.role === 'STAFF'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-white/10 text-white/80 border border-white/20'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Riot ID / Valorant */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Compte Riot Games / Valorant</h2>
              
              {user?.riotId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-emerald-300 font-bold">Riot ID vérifié</p>
                        <p className="text-lg font-black text-white">{user.riotId}</p>
                      </div>
                      <span className="text-2xl">✓</span>
                    </div>
                    {user.valorantRank && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/20">
                        <p className="text-sm text-emerald-300 mb-1">Rang Valorant actuel</p>
                        <p className="text-2xl font-black text-white">{user.valorantRank}</p>
                        {user.valorantRankUpdated && (
                          <p className="text-xs text-white/60 mt-1">
                            Mis à jour le {new Date(user.valorantRankUpdated).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <form action={refreshRank}>
                    <Button type="submit" variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                      🔄 Actualiser le rang
                    </Button>
                  </form>

                  <form action={saveRiotId} className="space-y-4">
                    <div>
                      <label htmlFor="riotId" className="block text-sm font-bold text-white mb-2">
                        Modifier le Riot ID
                      </label>
                      <input
                        type="text"
                        id="riotId"
                        name="riotId"
                        placeholder="VotreNom#TAG"
                        defaultValue={user.riotId}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600">
                      Mettre à jour
                    </Button>
                  </form>
                </div>
              ) : (
                <form action={saveRiotId} className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl mb-4">
                    <p className="text-sm text-blue-200">
                      <strong className="text-white">Configurez votre Riot ID</strong> pour afficher votre rang Valorant sur votre profil.
                      Format attendu : <code className="bg-blue-500/20 px-2 py-1 rounded text-white">VotreNom#TAG</code>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="riotId" className="block text-sm font-bold text-white mb-2">
                      Riot ID *
                    </label>
                    <input
                      type="text"
                      id="riotId"
                      name="riotId"
                      required
                      placeholder="VotreNom#TAG"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Exemple: PlayerOne#EU1
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600" size="lg">
                    Vérifier et enregistrer
                    </Button>
                </form>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Link href="/">
                <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
