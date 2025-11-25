'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// API Valorant de Henrik (gratuite)
// Docs: https://docs.henrikdev.xyz/
const HENRIK_API_BASE = 'https://api.henrikdev.xyz/valorant/v2'

export async function updateValorantRank(riotId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  // Parser le Riot ID (format: Name#TAG)
  const [name, tag] = riotId.split('#')
  
  if (!name || !tag) {
    throw new Error('Format Riot ID invalide (attendu: Name#TAG)')
  }

  try {
    // Headers avec clé API optionnelle
    const headers: Record<string, string> = {
      'User-Agent': 'ESport Tournament Platform',
    }
    
    if (process.env.HENRIK_API_KEY) {
      headers['Authorization'] = process.env.HENRIK_API_KEY
    }

    // Récupérer le MMR (rang) - API v2
    const mmrResponse = await fetch(
      `${HENRIK_API_BASE}/mmr/eu/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
      { 
        headers,
        cache: 'no-store', // Pas de cache Next.js pour avoir les données à jour
      }
    )

    if (!mmrResponse.ok) {
      const errorData = await mmrResponse.json().catch(() => ({}))
      
      if (mmrResponse.status === 404) {
        throw new Error('Compte Riot Games non trouvé. Vérifiez le format Name#TAG')
      }
      if (mmrResponse.status === 429) {
        throw new Error('Trop de requêtes. Réessayez dans quelques instants')
      }
      if (mmrResponse.status === 401 || mmrResponse.status === 403) {
        throw new Error('Clé API invalide ou manquante. Configurez HENRIK_API_KEY dans .env')
      }
      
      console.error('Henrik API error:', errorData)
      throw new Error(errorData.errors?.[0]?.message || 'Erreur API Valorant')
    }

    const mmrData = await mmrResponse.json()
    
    if (!mmrData.data) {
      throw new Error('Aucune donnée de rang trouvée pour ce compte')
    }

    // Extraire le rang
    const rank = mmrData.data.current_data?.currenttierpatched || 'Unranked'
    const rr = mmrData.data.current_data?.ranking_in_tier || 0

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        riotId,
        valorantRank: `${rank} (${rr} RR)`,
        valorantRankUpdated: new Date(),
      },
    })

    return { 
      success: true, 
      rank: `${rank} (${rr} RR)`,
      fullData: mmrData.data 
    }
  } catch (error: any) {
    console.error('Erreur Valorant API:', error)
    throw new Error(error.message || 'Erreur lors de la récupération du rang')
  }
}

export async function refreshValorantRank() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Non authentifié')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { riotId: true },
  })

  if (!user?.riotId) {
    throw new Error('Aucun Riot ID configuré')
  }

  return updateValorantRank(user.riotId)
}
