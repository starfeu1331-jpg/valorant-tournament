import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

async function createStaffConversation(formData: FormData) {
  'use server'
  
  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Non connecté')
  }

  const subject = formData.get('subject') as string
  const content = formData.get('content') as string

  if (!subject?.trim() || !content?.trim()) {
    throw new Error('Le sujet et le message sont requis')
  }

  // Créer la conversation
  const conversation = await prisma.staffConversation.create({
    data: {
      userId: session.user.id,
      subject: subject.trim(),
      status: 'OPEN',
    },
  })

  // Créer le premier message
  await prisma.staffMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      content: content.trim(),
      isStaffReply: false,
    },
  })

  // Créer une notification pour tous les staff
  const staffUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['STAFF', 'ADMIN'],
      },
    },
    select: {
      id: true,
    },
  })

  // Récupérer le nom d'utilisateur
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  })

  await prisma.notification.createMany({
    data: staffUsers.map(staff => ({
      userId: staff.id,
      type: 'STAFF_CONVERSATION_NEW',
      title: 'Nouveau message',
      message: `${currentUser?.username || 'Un joueur'} a créé une demande: ${subject}`,
      relatedId: conversation.id,
    })),
  })

  redirect(`/messages/staff/${conversation.id}`)
}

export default async function ContactStaffPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Vérifier s'il y a déjà une conversation ouverte
  const existingOpenConversation = await prisma.staffConversation.findFirst({
    where: {
      userId: session.user.id,
      status: 'OPEN',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1.5s'}} />
      
      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10">← Retour</Button>
          </Link>
        </div>

        <div className="glass-card rounded-4xl border border-white/20 p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💬</div>
            <h1 className="text-4xl font-display font-black text-white mb-2">Contacter le Staff</h1>
            <p className="text-white/80 text-lg">
              Posez vos questions ou signalez un problème à notre équipe
            </p>
          </div>

          {existingOpenConversation && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6">
              <p className="text-blue-200 font-bold mb-2">
                Vous avez déjà une conversation ouverte
              </p>
              <p className="text-blue-300 text-sm mb-3">
                Sujet: {existingOpenConversation.subject}
              </p>
              <Link href={`/messages/staff/${existingOpenConversation.id}`}>
                <Button size="sm" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  Voir la conversation
                </Button>
              </Link>
            </div>
          )}

          <form action={createStaffConversation} className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-bold text-white mb-2">
                Sujet <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                maxLength={100}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                placeholder="Ex: Question sur un tournoi, problème technique..."
                required
              />
              <p className="text-xs text-white/60 mt-1">
                Décrivez brièvement votre demande (max 100 caractères)
              </p>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-bold text-white mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows={8}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:ring-2 focus:ring-red-500 backdrop-blur-sm"
                placeholder="Décrivez votre demande en détail..."
                required
              />
              <p className="text-xs text-white/60 mt-1">
                Soyez aussi précis que possible pour que nous puissions vous aider au mieux
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="font-bold text-sm mb-2 text-white">À savoir :</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Le staff répondra dans les plus brefs délais</li>
                <li>• Vous recevrez une notification lors de la réponse</li>
                <li>• Vous pouvez avoir plusieurs conversations en même temps</li>
                <li>• Soyez respectueux dans vos échanges</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-red-500 to-red-600">
                Envoyer ma demande
              </Button>
              <Link href="/">
                <Button type="button" variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Mes conversations */}
        <div className="mt-8 glass-card rounded-4xl border border-white/20 p-6">
          <h2 className="font-bold text-lg mb-4 text-white">Mes conversations avec le staff</h2>
          <Link href="/messages/staff">
            <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
              Voir toutes mes conversations
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
