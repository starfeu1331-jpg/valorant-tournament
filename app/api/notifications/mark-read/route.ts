import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markNotificationAsRead } from '@/lib/actions/notifications'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { notificationId } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    await markNotificationAsRead(notificationId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
