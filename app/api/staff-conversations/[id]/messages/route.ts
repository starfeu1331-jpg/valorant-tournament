import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const conversationId = params.id

  // Vérifier l'accès
  const conversation = await prisma.staffConversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    return new Response('Not found', { status: 404 })
  }

  const isStaff = session.user.role === 'STAFF' || session.user.role === 'ADMIN'
  const isOwner = conversation.userId === session.user.id

  if (!isStaff && !isOwner) {
    return new Response('Forbidden', { status: 403 })
  }

  // Récupérer les messages avec leur expéditeur
  const messages = await prisma.staffMessage.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Si c'est un staff, marquer les messages du joueur comme lus
  if (isStaff) {
    await prisma.staffMessage.updateMany({
      where: {
        conversationId,
        isStaffReply: false,
        readByStaff: false,
      },
      data: {
        readByStaff: true,
      },
    })
  }

  return Response.json({ messages, lastUpdate: new Date().toISOString() })
}
