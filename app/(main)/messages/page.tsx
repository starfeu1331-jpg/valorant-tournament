import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Récupérer tous les messages privés (envoyés et reçus)
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id }
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
      createdAt: 'desc'
    }
  })

  // Récupérer les conversations avec le staff
  const staffConversations = await prisma.staffConversation.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    }
  })

  // Grouper les messages privés par conversation
  const conversationsMap = new Map<string, typeof messages>()
  
  messages.forEach(message => {
    const otherUserId = message.senderId === session.user.id 
      ? message.receiverId 
      : message.senderId
    
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, [])
    }
    conversationsMap.get(otherUserId)!.push(message)
  })

  // Créer les conversations privées
  const privateConversations = Array.from(conversationsMap.entries()).map(([otherUserId, msgs]) => {
    const lastMessage = msgs[0]
    const otherUser = lastMessage.senderId === session.user.id 
      ? lastMessage.receiver 
      : lastMessage.sender
    const unreadCount = msgs.filter(m => 
      m.receiverId === session.user.id && !m.read
    ).length

    return {
      type: 'private' as const,
      otherUser,
      lastMessage: {
        content: lastMessage.content,
        subject: lastMessage.subject,
        createdAt: lastMessage.createdAt,
        senderId: lastMessage.senderId
      },
      unreadCount,
      link: `/messages/${otherUser.id}`
    }
  })

  // Créer les conversations staff
  const staffConversationsList = staffConversations.map(conv => ({
    type: 'staff' as const,
    conversation: conv,
    lastMessage: {
      content: conv.messages[0]?.content || conv.subject,
      subject: conv.subject,
      createdAt: conv.lastMessageAt,
      senderId: null as string | null
    },
    unreadCount: 0, // On pourrait calculer ça si besoin
    link: `/messages/staff/${conv.id}`
  }))

  // Combiner et trier toutes les conversations par date
  const allConversations = [
    ...privateConversations,
    ...staffConversationsList
  ].sort((a, b) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  )

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '2s'}} />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="glass-card rounded-4xl border border-white/20">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-3xl font-display font-black text-white">Messages</h1>
            <p className="text-white/80 mt-1">
              Conversations avec le staff et les autres joueurs
            </p>
          </div>

          {/* Liste des conversations */}
          <div className="divide-y divide-white/10">
            {allConversations.length === 0 ? (
              <div className="p-8 text-center text-white/70">
                <p className="text-lg">Aucun message</p>
                <p className="text-sm mt-2 text-white/60">
                  Vos conversations avec le staff et les autres joueurs apparaîtront ici
                </p>
              </div>
            ) : (
              allConversations.map((conv, index) => (
                <Link
                  key={conv.type === 'private' ? conv.otherUser.id : conv.conversation.id}
                  href={conv.link}
                  className="block p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.type === 'private' ? (
                        <>
                          <img
                            src={conv.otherUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.username}`}
                            alt={conv.otherUser.username}
                            className="w-12 h-12 rounded-full border-2 border-white/20"
                          />
                          {conv.otherUser.role === 'STAFF' && (
                            <span className="absolute -top-1 -right-1 text-xs">⭐</span>
                          )}
                          {conv.otherUser.role === 'ADMIN' && (
                            <span className="absolute -top-1 -right-1 text-xs">👑</span>
                          )}
                        </>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl">
                          📞
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-bold text-white truncate">
                          {conv.type === 'private' ? (
                            <>
                              {conv.otherUser.username}
                              {conv.otherUser.role === 'STAFF' && (
                                <span className="ml-2 text-xs text-yellow-400">Staff</span>
                              )}
                              {conv.otherUser.role === 'ADMIN' && (
                                <span className="ml-2 text-xs text-purple-400">Admin</span>
                              )}
                            </>
                          ) : (
                            <>
                              Support Staff
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded font-bold ${
                                conv.conversation.status === 'OPEN' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-white/10 text-white/80 border border-white/20'
                              }`}>
                                {conv.conversation.status === 'OPEN' ? 'En cours' : 'Résolue'}
                              </span>
                            </>
                          )}
                        </h3>
                        <time className="text-xs text-white/60 flex-shrink-0">
                          {formatDate(conv.lastMessage.createdAt)}
                        </time>
                      </div>

                      {conv.lastMessage.subject && (
                        <p className="text-sm font-bold text-white/90 mt-1 truncate">
                          {conv.lastMessage.subject}
                        </p>
                      )}

                      <p className="text-sm text-white/70 mt-1 truncate">
                        {conv.type === 'private' && conv.lastMessage.senderId === session.user.id && (
                          <span className="text-white/50">Vous: </span>
                        )}
                        {conv.lastMessage.content}
                      </p>

                      {conv.unreadCount > 0 && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                          {conv.unreadCount} nouveau{conv.unreadCount > 1 ? 'x' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
