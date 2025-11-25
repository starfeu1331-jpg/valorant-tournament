import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Envoyer le count initial
      const initialCount = await prisma.message.count({
        where: {
          receiverId: session.user.id,
          read: false
        }
      })
      sendEvent({ unreadCount: initialCount })

      // Vérifier toutes les 2 secondes
      const interval = setInterval(async () => {
        try {
          const count = await prisma.message.count({
            where: {
              receiverId: session.user.id,
              read: false
            }
          })
          sendEvent({ unreadCount: count })
        } catch (error) {
          console.error('Error checking messages:', error)
        }
      }, 2000)

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
