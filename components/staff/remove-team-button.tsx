'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface RemoveTeamButtonProps {
  tournamentTeamId: string
  teamName: string
  tournamentId: string
}

export function RemoveTeamButton({ tournamentTeamId, teamName, tournamentId }: RemoveTeamButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert('Veuillez entrer une raison')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/staff/remove-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentTeamId,
          reason: reason.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors du retrait de l\'équipe')
      }

      setShowDialog(false)
      setReason('')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Erreur lors du retrait de l\'équipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-red-300 text-red-600 hover:bg-red-50"
        onClick={() => setShowDialog(true)}
      >
        🗑️ Retirer
      </Button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Retirer l'équipe {teamName}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du retrait *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                  placeholder="Expliquez pourquoi cette équipe est retirée..."
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false)
                    setReason('')
                  }}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'Retrait en cours...' : 'Confirmer le retrait'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
