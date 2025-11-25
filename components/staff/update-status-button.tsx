'use client'

import { updateTournamentStatus } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function UpdateStatusButton({ 
  tournamentId, 
  currentStatus 
}: { 
  tournamentId: string
  currentStatus: string 
}) {
  const [loading, setLoading] = useState(false)

  const statusOptions = [
    { value: 'UPCOMING', label: 'À venir' },
    { value: 'REGISTRATION_OPEN', label: 'Inscriptions ouvertes' },
    { value: 'ONGOING', label: 'En cours' },
    { value: 'COMPLETED', label: 'Terminé' },
  ]

  async function handleStatusChange(newStatus: string) {
    if (loading || newStatus === currentStatus) return

    setLoading(true)
    try {
      await updateTournamentStatus(tournamentId, newStatus)
    } catch (error) {
      alert('Erreur lors du changement de statut')
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <span className="text-sm font-medium text-gray-700">Changer le statut:</span>
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={loading}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
