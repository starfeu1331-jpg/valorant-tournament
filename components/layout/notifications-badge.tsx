'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { Session } from 'next-auth'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  relatedId: string | null
  createdAt: string
}

export function NotificationsBadge({ session }: { session: Session }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fonction pour fetch le count
  const fetchCount = async () => {
    try {
      const res = await fetch('/api/notifications/count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching notification count:', error)
    }
  }

  // Fonction pour fetch les notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/list')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // SSE pour le compteur en temps réel
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setUnreadCount(data.count || 0)
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
      
      // Fallback sur polling si SSE échoue
      const interval = setInterval(fetchCount, 5000)
      return () => clearInterval(interval)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // Refetch les notifications quand le dropdown est ouvert
  useEffect(() => {
    if (isOpen) {
      fetchNotifications() // Fetch immédiat à l'ouverture
      const interval = setInterval(fetchNotifications, 3000) // Refresh toutes les 3s quand ouvert
      return () => clearInterval(interval)
    }
  }, [isOpen])

  // Fetch notifications quand on ouvre le dropdown
  const handleToggle = async () => {
    if (!isOpen) {
      setIsLoading(true)
      await fetchNotifications()
      setIsLoading(false)
    }
    setIsOpen(!isOpen)
  }

  // Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
      
      // Mettre à jour immédiatement l'état local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // Refetch après un court délai pour être sûr
      setTimeout(() => {
        fetchCount()
        fetchNotifications()
      }, 100)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      
      // Mettre à jour immédiatement l'état local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      
      // Refetch après un court délai
      setTimeout(() => {
        fetchCount()
        fetchNotifications()
      }, 100)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

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

  const getNotificationLink = (notification: Notification) => {
    if (!notification.relatedId) return '#'
    
    // Déterminer si l'utilisateur est staff
    const isStaff = session.user.role === 'STAFF' || session.user.role === 'ADMIN'
    
    switch (notification.type) {
      case 'TEAM_VALIDATED':
      case 'TEAM_REJECTED':
      case 'REGISTRATION_SUBMITTED':
        return `/tournaments/${notification.relatedId}`
      case 'STAFF_MESSAGE':
        return '/messages'
      case 'STAFF_CONVERSATION_NEW':
        // Les staff vont vers la vue staff
        return isStaff ? `/staff/messages/${notification.relatedId}` : '#'
      case 'STAFF_CONVERSATION_REPLY':
        // Staff -> vue staff, Joueur -> vue joueur
        return isStaff 
          ? `/staff/messages/${notification.relatedId}` 
          : `/messages/staff/${notification.relatedId}`
      default:
        return '#'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar avec badge */}
      <button
        onClick={handleToggle}
        className="relative focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full ring-2 ring-primary-100 hover:ring-primary-300 transition-all"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold hover:scale-105 transition-transform">
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        
        {/* Pastille rouge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-lg border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 5).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-primary-50' : ''
                    }`}
                  >
                    <Link
                      href={getNotificationLink(notification)}
                      onClick={(e) => {
                        if (!notification.read) {
                          e.preventDefault() // Empêcher la navigation immédiate
                          markAsRead(notification.id)
                          // Naviguer après un court délai
                          setTimeout(() => {
                            window.location.href = getNotificationLink(notification)
                          }, 200)
                        }
                        // Ne pas fermer le dropdown immédiatement
                      }}
                      className="block"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 h-2 w-2 bg-primary-600 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Voir mon profil →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
