import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Permet le streaming de données
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Fonction pour envoyer des données au client
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Envoyer le count initial
      try {
        const initialCount = await prisma.notification.count({
          where: {
            userId: session.user.id,
            read: false,
          },
        })
        sendEvent({ count: initialCount })
      } catch (error) {
        console.error('Error fetching initial count:', error)
      }

      // Polling toutes les 2 secondes pour vérifier les nouvelles notifications
      const interval = setInterval(async () => {
        try {
          const count = await prisma.notification.count({
            where: {
              userId: session.user.id,
              read: false,
            },
          })
          sendEvent({ count })
        } catch (error) {
          console.error('Error fetching notification count:', error)
        }
      }, 2000) // Vérifie toutes les 2 secondes

      // Nettoyer quand le client se déconnecte
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
