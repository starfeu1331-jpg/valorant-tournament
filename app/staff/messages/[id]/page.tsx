import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import { StaffReplyForm } from '@/components/messages/staff-reply-form'
import { MessagesContainer } from '@/components/messages/messages-container'

async function sendStaffMessage(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const conversationId = formData.get('conversationId') as string
  const content = formData.get('content') as string

  if (!content?.trim()) {
    throw new Error('Le message ne peut pas être vide')
  }

  const conversation = await prisma.staffConversation.findUnique({
    where: { id: conversationId },
    include: { user: true },
  })

  if (!conversation) {
    throw new Error('Conversation introuvable')
  }

  // Créer le message
  await prisma.staffMessage.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
      isStaffReply: true,
    },
  })

  // Mettre à jour la date du dernier message
  await prisma.staffConversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
    },
  })

  // Créer une notification pour le joueur
  await prisma.notification.create({
    data: {
      userId: conversation.userId,
      type: 'STAFF_CONVERSATION_REPLY',
      title: 'Réponse du staff',
      message: `Le staff a répondu à votre demande: ${conversation.subject}`,
      relatedId: conversationId,
    },
  })

  revalidatePath(`/staff/messages/${conversationId}`)
}

async function toggleConversationStatus(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    throw new Error('Non autorisé')
  }

  const conversationId = formData.get('conversationId') as string
  const newStatus = formData.get('newStatus') as string

  await prisma.staffConversation.update({
    where: { id: conversationId },
    data: {
      status: newStatus as 'OPEN' | 'CLOSED',
    },
  })

  revalidatePath(`/staff/messages/${conversationId}`)
  revalidatePath('/staff/messages')
}

export default async function StaffConversationPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/')
  }

  const conversation = await prisma.staffConversation.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
          role: true,
        },
      },
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

  if (!conversation) {
    redirect('/staff/messages')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <Link href="/staff/messages">
                <Button variant="outline" size="sm">← Retour</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{conversation.subject}</h1>
                <p className="text-gray-600 mt-1">
                  Conversation avec{' '}
                  <Link href={`/joueurs/${conversation.user.id}`} className="font-medium text-blue-600 hover:underline">
                    {conversation.user.username}
                  </Link>
                  {conversation.user.role === 'STAFF' && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                      STAFF
                    </span>
                  )}
                  {conversation.user.role === 'ADMIN' && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                      ADMIN
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded font-medium text-sm ${
                  conversation.status === 'OPEN'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {conversation.status === 'OPEN' ? 'OUVERT' : 'FERMÉ'}
              </span>
              <form action={toggleConversationStatus}>
                <input type="hidden" name="conversationId" value={conversation.id} />
                <input
                  type="hidden"
                  name="newStatus"
                  value={conversation.status === 'OPEN' ? 'CLOSED' : 'OPEN'}
                />
                <Button type="submit" variant="outline" size="sm">
                  {conversation.status === 'OPEN' ? 'Fermer' : 'Rouvrir'}
                </Button>
              </form>
            </div>
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
            isStaffView={true}
            currentUserId={session.user.id}
            isStaff={true}
          />
        </div>

        {/* Formulaire de réponse */}
        {conversation.status === 'OPEN' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">Répondre</h3>
            <StaffReplyForm conversationId={conversation.id} action={sendStaffMessage} />
          </div>
        )}

        {conversation.status === 'CLOSED' && (
          <div className="bg-gray-100 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              Cette conversation est fermée. Rouvrez-la pour pouvoir répondre.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
