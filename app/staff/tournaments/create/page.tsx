'use client'

import { createTournament } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function CreateTournamentPage() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await createTournament(formData)
    } catch (error) {
      console.error('Erreur lors de la création du tournoi:', error)
      alert('Une erreur est survenue lors de la création du tournoi')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[url('/images/backgrounds/fond_of.jpg')] bg-cover bg-center bg-fixed relative py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-green-600/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">Créer un nouveau tournoi</h1>
          <p className="text-white/60 mt-2">
            Remplissez les informations pour créer un nouveau tournoi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-4xl border border-white/20 p-8 space-y-6">
          {/* Informations générales */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Informations générales</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
                  Nom du tournoi *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Championnat Valorant 2025"
                />
              </div>

              <div>
                <label htmlFor="game" className="block text-sm font-medium text-white/80 mb-1">
                  Jeu *
                </label>
                <select
                  id="game"
                  name="game"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Valorant">Valorant</option>
                  <option value="League of Legends">League of Legends</option>
                  <option value="Counter-Strike 2">Counter-Strike 2</option>
                  <option value="Rocket League">Rocket League</option>
                  <option value="Overwatch 2">Overwatch 2</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-white/80 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Décrivez votre tournoi..."
                />
              </div>

              <div>
                <label htmlFor="rules" className="block text-sm font-medium text-white/80 mb-1">
                  Règlement
                </label>
                <textarea
                  id="rules"
                  name="rules"
                  rows={6}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Règlement du tournoi..."
                />
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Format du tournoi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="maxTeams" className="block text-sm font-medium text-white/80 mb-1">
                  Nombre d'équipes max *
                </label>
                <input
                  type="number"
                  id="maxTeams"
                  name="maxTeams"
                  required
                  min="2"
                  max="128"
                  defaultValue="8"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="format" className="block text-sm font-medium text-white/80 mb-1">
                  Format bracket *
                </label>
                <select
                  id="format"
                  name="format"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SINGLE_ELIMINATION">Simple élimination</option>
                  <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                  <option value="ROUND_ROBIN" disabled>Round Robin (bientôt)</option>
                </select>
              </div>

              <div>
                <label htmlFor="matchFormat" className="block text-sm font-medium text-white/80 mb-1">
                  Format des matches *
                </label>
                <select
                  id="matchFormat"
                  name="matchFormat"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="BO1">BO1 (Best of 1)</option>
                  <option value="BO3">BO3 (Best of 3)</option>
                  <option value="BO5">BO5 (Best of 5)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Dates</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="registrationOpenAt" className="block text-sm font-medium text-white/80 mb-1">
                  Ouverture des inscriptions *
                </label>
                <input
                  type="datetime-local"
                  id="registrationOpenAt"
                  name="registrationOpenAt"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="registrationCloseAt" className="block text-sm font-medium text-white/80 mb-1">
                  Fermeture des inscriptions *
                </label>
                <input
                  type="datetime-local"
                  id="registrationCloseAt"
                  name="registrationCloseAt"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-white/80 mb-1">
                  Date de début du tournoi *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pick & Ban */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-white">Options avancées</h2>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pickBanEnabled"
                name="pickBanEnabled"
                value="true"
                className="w-5 h-5 text-red-500 bg-white/10 border-white/20 rounded focus:ring-red-500"
              />
              <label htmlFor="pickBanEnabled" className="text-sm font-medium text-white/80">
                Activer le système Pick & Ban pour les matches
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 rounded-xl"
            >
              {loading ? 'Création en cours...' : 'Créer le tournoi'}
            </Button>
            <a href="/staff">
              <Button type="button" className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl" size="lg">
                Annuler
              </Button>
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
