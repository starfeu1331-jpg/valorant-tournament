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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon profil</h1>

            {/* Info Discord */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informations Discord</h2>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {user?.image && (
                  <img src={user.image} alt={user.username} className="w-16 h-16 rounded-full" />
                )}
                <div>
                  <p className="font-bold text-gray-900">{user?.username}</p>
                  <p className="text-sm text-gray-600">Discord ID: {user?.discordId}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                      user?.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : user?.role === 'STAFF'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Riot ID / Valorant */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Compte Riot Games / Valorant</h2>
              
              {user?.riotId ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-green-800 font-medium">Riot ID vérifié</p>
                        <p className="text-lg font-bold text-gray-900">{user.riotId}</p>
                      </div>
                      <span className="text-2xl">✓</span>
                    </div>
                    {user.valorantRank && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-sm text-green-800 mb-1">Rang Valorant actuel</p>
                        <p className="text-2xl font-bold text-gray-900">{user.valorantRank}</p>
                        {user.valorantRankUpdated && (
                          <p className="text-xs text-gray-600 mt-1">
                            Mis à jour le {new Date(user.valorantRankUpdated).toLocaleString('fr-FR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <form action={refreshRank}>
                    <Button type="submit" variant="outline" className="w-full">
                      🔄 Actualiser le rang
                    </Button>
                  </form>

                  <form action={saveRiotId} className="space-y-4">
                    <div>
                      <label htmlFor="riotId" className="block text-sm font-medium text-gray-900 mb-2">
                        Modifier le Riot ID
                      </label>
                      <input
                        type="text"
                        id="riotId"
                        name="riotId"
                        placeholder="VotreNom#TAG"
                        defaultValue={user.riotId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Mettre à jour
                    </Button>
                  </form>
                </div>
              ) : (
                <form action={saveRiotId} className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Configurez votre Riot ID</strong> pour afficher votre rang Valorant sur votre profil.
                      Format attendu : <code className="bg-blue-100 px-2 py-1 rounded">VotreNom#TAG</code>
                    </p>
                  </div>

                  <div>
                    <label htmlFor="riotId" className="block text-sm font-medium text-gray-900 mb-2">
                      Riot ID *
                    </label>
                    <input
                      type="text"
                      id="riotId"
                      name="riotId"
                      required
                      placeholder="VotreNom#TAG"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Exemple: PlayerOne#EU1
                    </p>
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Vérifier et enregistrer
                    </Button>
                </form>
              )}
            </div>

            <div className="pt-4 border-t">
              <Link href="/">
                <Button variant="outline" className="w-full">
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
