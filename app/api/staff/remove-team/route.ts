import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { removeTeamFromTournament } from '@/lib/actions/staff'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { tournamentTeamId, reason } = await request.json()

    if (!tournamentTeamId || !reason) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    await removeTeamFromTournament(tournamentTeamId, reason)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors du retrait de l\'équipe:', error)
    return NextResponse.json(
      { error: 'Erreur lors du retrait de l\'équipe' },
      { status: 500 }
    )
  }
}
