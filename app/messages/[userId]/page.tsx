import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { MessageForm } from '@/components/messages/message-form'
import { revalidatePath } from 'next/cache'

export default async function ConversationPage({
  params,
}: {
  params: { userId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Récupérer l'autre utilisateur
  const otherUser = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      username: true,
      image: true,
      role: true
    }
  })

  if (!otherUser) {
    redirect('/messages')
  }

  // Récupérer tous les messages de cette conversation
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: params.userId },
        { senderId: params.userId, receiverId: session.user.id }
      ]
    },
    include: {
      sender: {
        select: { id: true, username: true, image: true, role: true }
      },
      receiver: {
        select: { id: true, username: true, image: true, role: true }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  // Marquer les messages non lus comme lus
  await prisma.message.updateMany({
    where: {
      senderId: params.userId,
      receiverId: session.user.id,
      read: false
    },
    data: {
      read: true
    }
  })

  async function sendMessage(formData: FormData) {
    'use server'
    
    const session = await getServerSession(authOptions)
    if (!session) return

    const content = formData.get('content') as string
    const subject = formData.get('subject') as string | null

    if (!content?.trim()) return

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: params.userId,
        subject: subject || undefined,
        content: content.trim()
      }
    })

    // Créer une notification pour le destinataire
    const { createNotification } = await import('@/lib/actions/notifications')
    await createNotification(
      params.userId,
      'STAFF_MESSAGE',
      '💬 Nouveau message',
      `${session.user.name} vous a envoyé un message`,
      session.user.id
    )

    revalidatePath(`/messages/${params.userId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Retour
            </Link>
            <div className="flex items-center gap-3">
              <img
                src={otherUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`}
                alt={otherUser.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h1 className="font-semibold text-gray-900">
                  {otherUser.username}
                </h1>
                <p className="text-xs text-gray-500">
                  {otherUser.role === 'ADMIN' ? '👑 Admin' : 
                   otherUser.role === 'STAFF' ? '⭐ Staff' : 
                   '🎮 Joueur'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md mb-4">
          <div className="p-6 space-y-6 min-h-[400px] max-h-[600px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p>Aucun message dans cette conversation</p>
                <p className="text-sm mt-2">Envoyez le premier message !</p>
              </div>
            ) : (
              messages.map((message: any) => {
                const isOwn = message.senderId === session.user.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {message.subject && (
                        <p className={`text-sm font-semibold mb-1 ${
                          isOwn ? 'text-right text-primary-700' : 'text-gray-700'
                        }`}>
                          {message.subject}
                        </p>
                      )}
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${
                        isOwn ? 'text-right' : 'text-left'
                      }`}>
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Formulaire d'envoi */}
        <MessageForm sendMessage={sendMessage} />
      </div>
    </div>
  )
}
