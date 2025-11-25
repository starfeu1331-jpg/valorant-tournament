'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function MessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Connexion SSE pour les mises à jour en temps réel
    const eventSource = new EventSource('/api/messages/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setUnreadCount(data.unreadCount)
    }

    eventSource.onerror = () => {
      eventSource.close()
      // Fallback sur polling toutes les 5 secondes
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/messages/count')
          if (res.ok) {
            const data = await res.json()
            setUnreadCount(data.count)
          }
        } catch (error) {
          console.error('Failed to fetch message count:', error)
        }
      }, 5000)

      return () => clearInterval(interval)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  if (unreadCount === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}
