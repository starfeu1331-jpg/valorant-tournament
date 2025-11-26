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
    <div className="min-h-screen pt-28 pb-16 relative">
      {/* Decorative bubbles */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="glass-card rounded-4xl border border-white/20 p-8 md:p-12 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white">Mes conversations</h1>
              <p className="text-white/70 mt-2">
                Suivez vos demandes et échanges avec l'équipe
              </p>
            </div>
            <Link href="/contact-staff">
              <Button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all">+ Nouvelle demande</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-medium text-white/60">Total</h3>
            <p className="text-4xl font-black text-gradient mt-2">{conversations.length}</p>
          </div>
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-medium text-white/60">En cours</h3>
            <p className="text-4xl font-black text-gradient mt-2">{openConversations.length}</p>
          </div>
          <div className="glass-card rounded-3xl border border-white/20 p-6">
            <h3 className="text-sm font-medium text-white/60">Résolues</h3>
            <p className="text-4xl font-black text-white/60 mt-2">{closedConversations.length}</p>
          </div>
        </div>

        {/* Conversations en cours */}
        {openConversations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">En cours</h2>
            <div className="glass-card rounded-4xl border border-white/20 divide-y divide-white/10">
              {openConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/messages/staff/${conversation.id}`}
                  className="block p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-white">{conversation.subject}</h3>
                        <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                          EN COURS
                        </span>
                      </div>
                      {conversation.messages[0] && (
                        <p className="text-sm text-white/70 mb-3 line-clamp-2">
                          <span className="font-medium text-white">
                            {conversation.messages[0].sender.role === 'PLAYER' ? 'Vous' : 'Staff'}:
                          </span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/50">
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
                    <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl" size="sm">
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
            <h2 className="text-2xl font-bold text-white mb-4">Résolues</h2>
            <div className="glass-card rounded-4xl border border-white/20 divide-y divide-white/10">
              {closedConversations.map(conversation => (
                <Link
                  key={conversation.id}
                  href={`/messages/staff/${conversation.id}`}
                  className="block p-6 hover:bg-white/5 transition-colors opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-white/80">{conversation.subject}</h3>
                        <span className="px-3 py-1 bg-white/10 text-white/60 text-xs font-medium rounded-full border border-white/20">
                          RÉSOLUE
                        </span>
                      </div>
                      {conversation.messages[0] && (
                        <p className="text-sm text-white/60 mb-3 line-clamp-2">
                          <span className="font-medium text-white/70">
                            {conversation.messages[0].sender.role === 'PLAYER' ? 'Vous' : 'Staff'}:
                          </span>{' '}
                          {conversation.messages[0].content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>{conversation._count.messages} message{conversation._count.messages > 1 ? 's' : ''}</span>
                        <span>
                          Terminée le {new Date(conversation.lastMessageAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <Button className="bg-white/5 border border-white/20 text-white hover:bg-white/10 rounded-xl" size="sm">
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
          <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">Aucune conversation</h3>
            <p className="text-white/70 mb-6">
              Vous n'avez pas encore contacté le staff
            </p>
            <Link href="/contact-staff">
              <Button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:scale-105 transition-all">Créer une demande</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
