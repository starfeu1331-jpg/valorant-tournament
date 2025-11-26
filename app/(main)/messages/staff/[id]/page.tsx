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
    <div className="min-h-screen bg-[url('/images/backgrounds/fond_of.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80 pointer-events-none" />
      <div className="fixed top-20 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* Header */}
        <div className="glass-card rounded-4xl border border-white/20 mb-6 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <Link href="/messages/staff">
                <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl" size="sm">← Mes conversations</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">{conversation.subject}</h1>
                <p className="text-white/60 mt-1">Conversation avec le staff</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-medium text-sm border ${
                conversation.status === 'OPEN'
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : 'bg-white/10 text-white/60 border-white/20'
              }`}
            >
              {conversation.status === 'OPEN' ? 'EN COURS' : 'RÉSOLUE'}
            </span>
          </div>
          <div className="text-sm text-white/40">
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
            isStaffView={false}
            currentUserId={session.user.id}
            isStaff={isStaffMember}
          />
        </div>

        {/* Formulaire de réponse */}
        {conversation.status === 'OPEN' && (
          <div className="glass-card rounded-4xl border border-white/20 p-6">
            <h3 className="font-bold mb-4 text-white">Répondre</h3>
            <PlayerReplyForm conversationId={conversation.id} action={sendPlayerMessage} />
          </div>
        )}

        {conversation.status === 'CLOSED' && (
          <div className="glass-card rounded-4xl border border-white/20 p-6 text-center">
            <p className="text-white/70 mb-4">
              Cette conversation a été résolue par le staff.
            </p>
            {!isStaffMember && (
              <Link href="/contact-staff">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl px-8">Créer une nouvelle demande</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
