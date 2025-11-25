'use client'

import { generateBracket } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function GenerateBracketButton({ tournamentId }: { tournamentId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (loading) return
    
    if (!confirm('Êtes-vous sûr de vouloir générer le bracket ? Cette action créera tous les matches.')) {
      return
    }

    setLoading(true)
    try {
      await generateBracket(tournamentId)
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la génération du bracket')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="bg-purple-600 hover:bg-purple-700"
    >
      {loading ? 'Génération...' : 'Générer le bracket'}
    </Button>
  )
}
