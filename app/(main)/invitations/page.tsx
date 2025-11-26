import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMyInvitations, acceptInvitation, declineInvitation } from '@/lib/actions/invitations'
import { Button } from '@/components/ui/button'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export default async function InvitationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/invitations')
  }

  const invitations = await getMyInvitations()

  async function handleAccept(formData: FormData) {
    'use server'
    const invitationId = formData.get('invitationId') as string
    const result = await acceptInvitation(invitationId)
    revalidatePath('/invitations')
    revalidatePath('/teams')
    redirect(`/teams/${result.teamId}`)
  }

  async function handleDecline(formData: FormData) {
    'use server'
    const invitationId = formData.get('invitationId') as string
    await declineInvitation(invitationId)
    revalidatePath('/invitations')
  }

  return (
    <div className="min-h-screen py-8">
      {/* Bulles décoratives */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none animate-float" style={{animationDelay: '1s'}} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-4xl p-8 md:p-12 border border-white/20 mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2">Mes invitations</h1>
            <p className="text-white/80 text-lg">Gérez vos invitations d'équipes</p>
          </div>

          {invitations.length === 0 ? (
            <div className="glass-card rounded-4xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-display font-black text-white mb-2">Aucune invitation</h2>
              <p className="text-white/70 mb-6">
                Vous n'avez pas d'invitation d'équipe en attente
              </p>
              <Link href="/teams">
                <Button size="lg" className="bg-gradient-to-r from-primary-500 to-primary-600">Voir mes équipes</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: any) => (
                <div key={invitation.id} className="glass-card rounded-3xl border border-white/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {invitation.team.name}
                      </h3>
                      <p className="text-white/80">
                        <span className="font-bold text-red-400">{invitation.team.tag}</span> • {invitation.team.game}
                      </p>
                      <p className="text-sm text-white/60 mt-2">
                        Invité par <strong className="text-white">{invitation.invitedBy.username}</strong> le {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <form action={handleAccept} className="flex-1">
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg" size="lg">
                        ✓ Accepter
                      </Button>
                    </form>
                    <form action={handleDecline} className="flex-1">
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10" size="lg">
                        ✗ Refuser
                      </Button>
                    </form>
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
