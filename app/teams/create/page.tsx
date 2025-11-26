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
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Créer une équipe</h1>
            <p className="text-white/70 mt-1">
              Créez votre équipe pour participer aux tournois e-sport
            </p>
          </div>

          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <form action={createTeam} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Nom de l'équipe *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Ex: Les Champions"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
                />
              </div>

              <div>
                <label htmlFor="tag" className="block text-sm font-medium text-white mb-2">
                  Tag (sigle) *
                </label>
                <input
                  type="text"
                  id="tag"
                  name="tag"
                  required
                  maxLength={10}
                  placeholder="Ex: CHAMP"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
                />
                <p className="text-sm text-white/60 mt-1">Maximum 10 caractères</p>
              </div>

              <div>
                <label htmlFor="game" className="block text-sm font-medium text-white mb-2">
                  Jeu principal *
                </label>
                <select
                  id="game"
                  name="game"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
                >
                  <option value="" className="bg-gray-900">Sélectionnez un jeu</option>
                  <option value="Valorant" className="bg-gray-900">Valorant</option>
                  <option value="League of Legends" className="bg-gray-900">League of Legends</option>
                  <option value="CS2" className="bg-gray-900">Counter-Strike 2</option>
                  <option value="Fortnite" className="bg-gray-900">Fortnite</option>
                  <option value="Rocket League" className="bg-gray-900">Rocket League</option>
                  <option value="Overwatch 2" className="bg-gray-900">Overwatch 2</option>
                  <option value="Autre" className="bg-gray-900">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Décrivez votre équipe, vos objectifs, votre niveau..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 focus:border-red-500 backdrop-blur-sm"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                <p className="text-sm text-blue-200">
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
