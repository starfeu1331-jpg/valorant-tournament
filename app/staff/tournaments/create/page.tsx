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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Créer un nouveau tournoi</h1>
          <p className="text-gray-600 mt-2">
            Remplissez les informations pour créer un nouveau tournoi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 space-y-6">
          {/* Informations générales */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Informations générales</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du tournoi *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Ex: Championnat Valorant 2025"
                />
              </div>

              <div>
                <label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-1">
                  Jeu *
                </label>
                <select
                  id="game"
                  name="game"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  <option value="Valorant">Valorant</option>
                  <option value="League of Legends">League of Legends</option>
                  <option value="Counter-Strike 2">Counter-Strike 2</option>
                  <option value="Rocket League">Rocket League</option>
                  <option value="Overwatch 2">Overwatch 2</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Décrivez votre tournoi..."
                />
              </div>

              <div>
                <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-1">
                  Règlement
                </label>
                <textarea
                  id="rules"
                  name="rules"
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Règlement du tournoi..."
                />
              </div>
            </div>
          </div>

          {/* Format */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Format du tournoi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="maxTeams" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                  Format bracket *
                </label>
                <select
                  id="format"
                  name="format"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                >
                  <option value="SINGLE_ELIMINATION">Simple élimination</option>
                  <option value="DOUBLE_ELIMINATION" disabled>Double élimination (bientôt)</option>
                  <option value="ROUND_ROBIN" disabled>Round Robin (bientôt)</option>
                </select>
              </div>

              <div>
                <label htmlFor="matchFormat" className="block text-sm font-medium text-gray-700 mb-1">
                  Format des matches *
                </label>
                <select
                  id="matchFormat"
                  name="matchFormat"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
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
            <h2 className="text-2xl font-bold mb-4">Dates</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="registrationOpenAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Ouverture des inscriptions *
                </label>
                <input
                  type="datetime-local"
                  id="registrationOpenAt"
                  name="registrationOpenAt"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="registrationCloseAt" className="block text-sm font-medium text-gray-700 mb-1">
                  Fermeture des inscriptions *
                </label>
                <input
                  type="datetime-local"
                  id="registrationCloseAt"
                  name="registrationCloseAt"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début du tournoi *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pick & Ban */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Options avancées</h2>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pickBanEnabled"
                name="pickBanEnabled"
                value="true"
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
              />
              <label htmlFor="pickBanEnabled" className="text-sm font-medium text-gray-700">
                Activer le système Pick & Ban pour les matches
              </label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-6 border-t">
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Création en cours...' : 'Créer le tournoi'}
            </Button>
            <a href="/staff">
              <Button type="button" variant="outline" size="lg">
                Annuler
              </Button>
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
