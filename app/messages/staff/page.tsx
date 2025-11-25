import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function MyStaffConversationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const conversations = await prisma.staffConversation.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          sender: {
            select: {
              username: true,
              role: true,
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mes conversations avec le staff</h1>
            <p className="text-gray-600 mt-1">
              Suivez vos demandes et échanges avec l'équipe
            </p>
          </div>
          <Link href="/contact-staff">
            <Button>+ Nouvelle demande</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total</h3>
            <p className="text-3xl font-bold mt-2">{conversations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">En cours</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{openConversations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Résolues</h3>
            <p className="text-3xl font-bold mt-2 text-gray-600">{closedConversations.length}</p>
          </div>
        </div>

        {/* Conversations en cours */}
        {openConversations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">En cours</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {openConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/messages/staff/${conversation.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{conversation.subject}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          EN COURS
                        </span>
                      </div>
                      {conversation.messages[0] && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          <span className="font-medium">
                            {conversation.messages[0].sender.role === 'PLAYER' ? 'Vous' : 'Staff'}:
                          </span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
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
                    <Button variant="outline" size="sm">
                      Voir →
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Conversations résolues */}
        {closedConversations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Résolues</h2>
            <div className="bg-white rounded-lg shadow divide-y">
              {closedConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/messages/staff/${conversation.id}`}
                  className="block p-6 hover:bg-gray-50 transition opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{conversation.subject}</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          RÉSOLUE
                        </span>
                      </div>
                      {conversation.messages[0] && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          <span className="font-medium">
                            {conversation.messages[0].sender.role === 'PLAYER' ? 'Vous' : 'Staff'}:
                          </span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{conversation._count.messages} message{conversation._count.messages > 1 ? 's' : ''}</span>
                        <span>
                          Terminée le {new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Voir →
                    </Button>
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
            <h3 className="text-xl font-bold mb-2">Aucune conversation</h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore contacté le staff
            </p>
            <Link href="/contact-staff">
              <Button>Créer une demande</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
