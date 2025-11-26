import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions/notifications'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/notifications')
  }

  const notifications = await getMyNotifications()
  const isStaff = session.user.role === 'STAFF' || session.user.role === 'ADMIN'

  async function handleMarkAsRead(formData: FormData) {
    'use server'
    const notificationId = formData.get('notificationId') as string
    await markNotificationAsRead(notificationId)
    revalidatePath('/notifications')
  }

  async function handleMarkAllAsRead() {
    'use server'
    await markAllNotificationsAsRead()
    revalidatePath('/notifications')
  }

  const unreadCount = notifications.filter((n: any) => !n.read).length

  // Fonction pour obtenir l'icône selon le type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TEAM_VALIDATED': return '✅'
      case 'TEAM_REJECTED': return '❌'
      case 'REGISTRATION_SUBMITTED': return '📝'
      case 'STAFF_MESSAGE': return '💬'
      case 'MATCH_SCHEDULED': return '📅'
      case 'STAFF_CONVERSATION_NEW': return '📞'
      case 'STAFF_CONVERSATION_REPLY': return '💬'
      default: return '🔔'
    }
  }

  // Fonction pour obtenir le lien selon le type
  const getNotificationLink = (notification: any) => {
    if (!notification.relatedId) return '#'
    
    switch (notification.type) {
      case 'TEAM_VALIDATED':
      case 'TEAM_REJECTED':
      case 'REGISTRATION_SUBMITTED':
        return `/tournaments/${notification.relatedId}`
      case 'STAFF_MESSAGE':
        return '/messages'
      case 'STAFF_CONVERSATION_NEW':
        return isStaff ? `/staff/messages/${notification.relatedId}` : '#'
      case 'STAFF_CONVERSATION_REPLY':
        return isStaff 
          ? `/staff/messages/${notification.relatedId}` 
          : `/messages/staff/${notification.relatedId}`
      default:
        return `/teams/${notification.relatedId}`
    }
  }

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-yellow-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-4xl p-8 border border-white/20 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-white/80 mt-1">
                    {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <form action={handleMarkAllAsRead}>
                  <Button type="submit" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                    Tout marquer comme lu
                  </Button>
                </form>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h2 className="text-2xl font-display font-black text-white mb-2">
                Aucune notification
              </h2>
              <p className="text-white/70">
                Vous serez notifié ici des événements importants
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`glass-card rounded-3xl border p-4 ${
                    !notification.read ? 'border-red-500/50 bg-red-500/5' : 'border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <h3 className="font-bold text-white">{notification.title}</h3>
                        {!notification.read && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-500/30">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 text-sm">{notification.message}</p>
                      <p className="text-xs text-white/60 mt-2">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                      {notification.relatedId && getNotificationLink(notification) !== '#' && (
                        <Link
                          href={getNotificationLink(notification)}
                          className="text-red-400 hover:text-red-300 text-sm font-bold inline-block mt-2"
                        >
                          Voir →
                        </Link>
                      )}
                    </div>
                    {!notification.read && (
                      <form action={handleMarkAsRead}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <Button type="submit" variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                          Marquer comme lu
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
