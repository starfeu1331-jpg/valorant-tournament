import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store pour les utilisateurs en train de taper (en mémoire, réinitialisé au redémarrage)
const typingUsers = new Map<string, Set<string>>() // conversationId -> Set<userId>
const typingTimeouts = new Map<string, NodeJS.Timeout>() // userId+conversationId -> timeout

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const conversationId = params.id
  const { isTyping } = await request.json()

  if (!typingUsers.has(conversationId)) {
    typingUsers.set(conversationId, new Set())
  }

  const users = typingUsers.get(conversationId)!
  const timeoutKey = `${session.user.id}-${conversationId}`
  
  if (isTyping) {
    // Annuler l'ancien timeout s'il existe
    const existingTimeout = typingTimeouts.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Ajouter l'utilisateur
    users.add(session.user.id)
    console.log(`✍️ User ${session.user.id} is typing in ${conversationId}. Current users:`, Array.from(users))
    
    // Créer un nouveau timeout de 3 secondes
    const timeout = setTimeout(() => {
      users.delete(session.user.id)
      typingTimeouts.delete(timeoutKey)
      console.log(`⏱️ Timeout: User ${session.user.id} stopped typing in ${conversationId}`)
    }, 3000)
    
    typingTimeouts.set(timeoutKey, timeout)
  } else {
    // Supprimer immédiatement
    const existingTimeout = typingTimeouts.get(timeoutKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      typingTimeouts.delete(timeoutKey)
    }
    users.delete(session.user.id)
    console.log(`❌ User ${session.user.id} stopped typing (manual) in ${conversationId}`)
  }

  return Response.json({ success: true })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const conversationId = params.id
  const users = typingUsers.get(conversationId) || new Set()
  
  console.log(`👀 GET typing for conversation ${conversationId}. All users:`, Array.from(users), 'Current user:', session.user.id)
  
  // Mode DEBUG : Ne pas filtrer son propre userId (pour tester avec un seul compte)
  const DEBUG_MODE = process.env.TYPING_DEBUG === 'true'
  
  const otherUsers = DEBUG_MODE 
    ? Array.from(users) // Mode debug : montrer tous les utilisateurs y compris soi-même
    : Array.from(users).filter(id => id !== session.user.id) // Mode normal : exclure l'utilisateur actuel
  
  console.log(`📤 Returning typing users (DEBUG=${DEBUG_MODE}):`, otherUsers)

  return Response.json({ typingUsers: otherUsers })
}
