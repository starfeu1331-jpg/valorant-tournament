import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import { PlayerReplyForm } from '@/components/messages/player-reply-form'
import { MessagesContainer } from '@/components/messages/messages-container'

async function sendPlayerMessage(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Non connecté')
  }

  const conversationId = formData.get('conversationId') as string
  const content = formData.get('content') as string

  if (!content?.trim()) {
    throw new Error('Le message ne peut pas être vide')
  }

  const conversation = await prisma.staffConversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error('Conversation introuvable')
  }

  if (conversation.status === 'CLOSED') {
    throw new Error('Cette conversation est fermée')
  }

  // Créer le message
  await prisma.staffMessage.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
      isStaffReply: false,
    },
  })

  // Mettre à jour la date du dernier message
  await prisma.staffConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
    },
  })

  // Créer une notification pour tous les staff
  const staffUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['STAFF', 'ADMIN'],
      },
    },
    select: {
      id: true,
    },
  })

  // Récupérer le nom d'utilisateur
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })

  await prisma.notification.createMany({
    data: staffUsers.map(staff => ({
      userId: staff.id,
      type: 'STAFF_CONVERSATION_REPLY',
      title: 'Nouvelle réponse',
      message: `${currentUser?.username || 'Un joueur'} a répondu: ${conversation.subject}`,
      relatedId: conversationId,
    })),
  })

  revalidatePath(`/messages/staff/${conversationId}`)
}

export default async function PlayerStaffConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const conversation = await prisma.staffConversation.findUnique({
    where: { id: params.id },
    include: {
      messages: {
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
      },
    },
  })

  if (!conversation || conversation.userId !== session.user.id) {
    redirect('/messages/staff')
  }

  const isStaffMember = session.user.role === 'STAFF' || session.user.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <Link href="/messages/staff">
                <Button variant="outline" size="sm">← Mes conversations</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{conversation.subject}</h1>
                <p className="text-gray-600 mt-1">Conversation avec le staff</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded font-medium text-sm ${
                conversation.status === 'OPEN'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {conversation.status === 'OPEN' ? 'EN COURS' : 'RÉSOLUE'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Créée le {new Date(conversation.createdAt).toLocaleDateString('fr-FR')} à{' '}
            {new Date(conversation.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' • '}
            {conversation.messages.length} message{conversation.messages.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <MessagesContainer
            conversationId={conversation.id}
            initialMessages={conversation.messages}
            isStaffView={false}
            currentUserId={session.user.id}
            isStaff={isStaffMember}
          />
        </div>

        {/* Formulaire de réponse */}
        {conversation.status === 'OPEN' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">Répondre</h3>
            <PlayerReplyForm conversationId={conversation.id} action={sendPlayerMessage} />
          </div>
        )}

        {conversation.status === 'CLOSED' && (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600 mb-4">
              Cette conversation a été résolue par le staff.
            </p>
            {!isStaffMember && (
              <Link href="/contact-staff">
                <Button>Créer une nouvelle demande</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
