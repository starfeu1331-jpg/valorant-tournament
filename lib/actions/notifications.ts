'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getMyNotifications() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Non authentifié')

  return await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function getUnreadNotificationsCount() {
  const session = await getServerSession(authOptions)
  if (!session) return 0

  return await prisma.notification.count({
    where: {
      userId: session.user.id,
      read: false,
    },
  })
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Non authentifié')

  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  })

  if (!notification || notification.userId !== session.user.id) {
    throw new Error('Notification non trouvée')
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Non authentifié')

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: { read: true },
  })
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string
) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      relatedId,
    },
  })
}
