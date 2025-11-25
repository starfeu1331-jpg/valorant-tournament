import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function StaffMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/')
  }

  const conversations = await prisma.staffConversation.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            select: {
              username: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      lastMessageAt: 'desc',
    },
  })

  const openConversations = conversations.filter(c => c.status === 'OPEN')
  const closedConversations = conversations.filter(c => c.status === 'CLOSED')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Messages des joueurs</h1>
            <p className="text-gray-600 mt-1">
              Gérez les conversations avec les joueurs
            </p>
          </div>
          <Link href="/staff">
            <Button variant="outline">Retour au dashboard</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="text-3xl font-bold mt-2">{conversations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Ouvertes</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{openConversations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Fermées</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{closedConversations.length}</p>
          </div>
        </div>

        {/* Conversations ouvertes */}
        {openConversations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Conversations ouvertes</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {openConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/staff/messages/${conversation.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={conversation.user.image || '/default-avatar.png'}
                      alt={conversation.user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{conversation.subject}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          OUVERT
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Joueur: <span className="font-medium">{conversation.user.username}</span>
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
                      {conversation.messages[0] && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">{conversation.messages[0].sender.username}:</span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{conversation._count.messages} message{conversation._count.messages > 1 ? 's' : ''}</span>
                        <span>
                          Dernier message: {new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(conversation.lastMessageAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conversations fermées */}
        {closedConversations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Conversations fermées</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {closedConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/staff/messages/${conversation.id}`}
                  className="block p-6 hover:bg-gray-50 transition opacity-75"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={conversation.user.image || '/default-avatar.png'}
                      alt={conversation.user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{conversation.subject}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          FERMÉ
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Joueur: <span className="font-medium">{conversation.user.username}</span>
                      </p>
                      {conversation.messages[0] && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">{conversation.messages[0].sender.username}:</span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{conversation._count.messages} message{conversation._count.messages > 1 ? 's' : ''}</span>
                        <span>
                          Dernier message: {new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Aucune conversation */}
        {conversations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Aucun message</h3>
            <p className="text-gray-600">
              Les conversations avec les joueurs apparaîtront ici
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
