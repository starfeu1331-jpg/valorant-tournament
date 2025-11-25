import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUnreadNotificationsCount } from '@/lib/actions/notifications'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ count: 0 })
  }

  const count = await getUnreadNotificationsCount()
  return NextResponse.json({ count })
}
