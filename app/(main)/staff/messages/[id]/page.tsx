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
    <div className="min-h-screen bg-[url('/images/backgrounds/fond_of.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Header */}
        <div className="glass-card rounded-4xl border border-white/20 mb-6 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Link href="/staff/messages">
                <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl flex items-center justify-center" size="sm">
                  <span className="md:hidden">←</span>
                  <span className="hidden md:inline">← Retour</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white break-words">{conversation.subject}</h1>
                <p className="text-sm text-white/70 mt-1">
                  Conversation avec{' '}
                  <Link href={`/joueurs/${conversation.user.id}`} className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                    {conversation.user.username}
                  </Link>
                  {conversation.user.role === 'STAFF' && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                      STAFF
                    </span>
                  )}
                  {conversation.user.role === 'ADMIN' && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30">
                      ADMIN
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`px-3 py-1 rounded-full font-medium text-xs md:text-sm border whitespace-nowrap ${
                  conversation.status === 'OPEN'
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-white/10 text-white/60 border-white/20'
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
                <Button type="submit" className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl whitespace-nowrap" size="sm">
                  {conversation.status === 'OPEN' ? 'Fermer' : 'Rouvrir'}
                </Button>
              </form>
            </div>
          </div>
          <div className="text-xs md:text-sm text-white/40">
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
        <div className="glass-card rounded-4xl border border-white/20 mb-6 p-6">
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
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h3 className="font-bold mb-4 text-white">Répondre</h3>
            <StaffReplyForm conversationId={conversation.id} action={sendStaffMessage} />
          </div>
        )}

        {conversation.status === 'CLOSED' && (
          <div className="glass-card rounded-4xl border border-white/20 p-6 text-center">
            <p className="text-white/70">
              Cette conversation est fermée. Rouvrez-la pour pouvoir répondre.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
