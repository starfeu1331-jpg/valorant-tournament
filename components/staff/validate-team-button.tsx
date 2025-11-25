'use client'

import { validateTeam } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function ValidateTeamButton({ tournamentTeamId }: { tournamentTeamId: string }) {
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  async function handleAccept() {
    if (loading) return
    setLoading(true)
    try {
      await validateTeam(tournamentTeamId, 'ACCEPTED')
    } catch (error) {
      alert('Erreur lors de l\'acceptation')
      setLoading(false)
    }
  }

  async function handleReject() {
    if (loading || !rejectionReason.trim()) return
    setLoading(true)
    try {
      await validateTeam(tournamentTeamId, 'REJECTED', rejectionReason)
    } catch (error) {
      alert('Erreur lors du refus')
      setLoading(false)
    }
  }

  if (showReject) {
    return (
      <div className="space-y-3">
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Motif du refus..."
          className="w-full px-3 py-2 border rounded-md text-sm"
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
            variant="default"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            Confirmer le refus
          </Button>
          <Button
            onClick={() => setShowReject(false)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleAccept}
        disabled={loading}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        Accepter
      </Button>
      <Button
        onClick={() => setShowReject(true)}
        disabled={loading}
        variant="outline"
        size="sm"
        className="text-red-600 border-red-600 hover:bg-red-50"
      >
        Refuser
      </Button>
    </div>
  )
}
