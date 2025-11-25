import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createTeam } from '@/lib/actions/teams'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function CreateTeamPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/teams/create')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Créer une équipe</h1>
            <p className="text-gray-600 mt-1">
              Créez votre équipe pour participer aux tournois e-sport
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form action={createTeam} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Nom de l'équipe *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Les Champions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="tag" className="block text-sm font-medium text-gray-900 mb-2">
                  Tag (sigle) *
                </label>
                <input
                  type="text"
                  id="tag"
                  name="tag"
                  required
                  maxLength={10}
                  placeholder="Ex: CHAMP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum 10 caractères</p>
              </div>

              <div>
                <label htmlFor="game" className="block text-sm font-medium text-gray-900 mb-2">
                  Jeu principal *
                </label>
                <select
                  id="game"
                  name="game"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Sélectionnez un jeu</option>
                  <option value="Valorant">Valorant</option>
                  <option value="League of Legends">League of Legends</option>
                  <option value="CS2">Counter-Strike 2</option>
                  <option value="Fortnite">Fortnite</option>
                  <option value="Rocket League">Rocket League</option>
                  <option value="Overwatch 2">Overwatch 2</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Décrivez votre équipe, vos objectifs, votre niveau..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note :</strong> Vous serez automatiquement désigné comme capitaine de l'équipe.
                  Vous pourrez ensuite inviter d'autres joueurs.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" size="lg" className="flex-1">
                  Créer l'équipe
                </Button>
                <Link href="/teams" className="flex-1">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
