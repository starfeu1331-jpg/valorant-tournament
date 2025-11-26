'use client'

import { useEffect, useState, useRef } from 'react'

interface Message {
  id: string
  senderId: string
  content: string
  isStaffReply: boolean
  readByStaff: boolean
  createdAt: string
  sender: {
    id: string
    username: string
    image: string | null
    role: string
  }
}

interface MessagesContainerProps {
  conversationId: string
  initialMessages: Message[]
  isStaffView: boolean
  currentUserId: string
  isStaff: boolean
}

export function MessagesContainer({
  conversationId,
  initialMessages,
  isStaffView,
  currentUserId,
  isStaff,
}: MessagesContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)

  // Scroll initial uniquement au premier chargement
  useEffect(() => {
    if (!hasScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      hasScrolledRef.current = true
    }
  }, [])

  // Polling pour nouveaux messages toutes les 2 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/staff-conversations/${conversationId}/messages`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [conversationId])

  // Polling pour indicateur de saisie
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/staff-conversations/${conversationId}/typing`)
        if (res.ok) {
          const data = await res.json()
          console.log('👥 Typing users:', data.typingUsers)
          setTypingUsers(data.typingUsers || [])
        }
      } catch (error) {
        console.error('Error fetching typing status:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [conversationId])

  console.log('🔄 Current typingUsers state:', typingUsers)

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isMyMessage = message.senderId === currentUserId
        const isStaffReply = message.isStaffReply
        const isStaffSender = message.sender.role === 'STAFF' || message.sender.role === 'ADMIN'
        
        // Alignement selon le type de message
        const alignRight = isStaffView ? isStaffReply : !isStaffReply

        return (
          <div
            key={message.id}
            className={`flex gap-4 ${alignRight ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <img
              src={message.sender.image || '/default-avatar.png'}
              alt={message.sender.username}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className={`flex-1 ${alignRight ? 'text-right' : 'text-left'}`}>
              <div
                className={`flex items-center gap-2 mb-1 ${
                  alignRight ? 'justify-end' : 'justify-start'
                }`}
              >
                <span className="font-bold text-white">
                  {isMyMessage ? 'Vous' : message.sender.username}
                </span>
                {isStaffSender && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded border ${
                      message.sender.role === 'ADMIN'
                        ? 'bg-red-500/20 text-red-300 border-red-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {message.sender.role}
                  </span>
                )}
                <span className="text-xs text-white/60">
                  {new Date(message.createdAt).toLocaleDateString('fr-FR')} à{' '}
                  {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {/* Indicateur "Lu" visible UNIQUEMENT dans la vue staff (pas pour les joueurs) */}
                {isStaffView && !isStaffReply && message.readByStaff && (
                  <span className="text-xs text-white/60">✓ Lu</span>
                )}
              </div>
              <div
                className={`inline-block rounded-lg px-4 py-3 ${
                  alignRight
                    ? isStaffView
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                    : isStaffView
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Indicateur de saisie */}
      {typingUsers.length > 0 && (
        <div className="flex gap-3 items-center text-gray-500 text-sm italic">
          <span>En train d'écrire</span>
          <div className="flex gap-1 items-end pb-1">
            <span 
              className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-typing-dot" 
              style={{ animationDelay: '0s' }}
            />
            <span 
              className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-typing-dot" 
              style={{ animationDelay: '0.2s' }}
            />
            <span 
              className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-typing-dot" 
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}
