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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mes invitations</h1>
            <p className="text-gray-600 mt-1">Gérez vos invitations d'équipes</p>
          </div>

          {invitations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucune invitation</h2>
              <p className="text-gray-600 mb-6">
                Vous n'avez pas d'invitation d'équipe en attente
              </p>
              <Link href="/teams">
                <Button size="lg">Voir mes équipes</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: any) => (
                <div key={invitation.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {invitation.team.name}
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-medium text-primary-600">{invitation.team.tag}</span> • {invitation.team.game}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Invité par <strong>{invitation.invitedBy.username}</strong> le {new Date(invitation.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <form action={handleAccept} className="flex-1">
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" className="w-full" size="lg">
                        ✓ Accepter
                      </Button>
                    </form>
                    <form action={handleDecline} className="flex-1">
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <Button type="submit" variant="outline" className="w-full" size="lg">
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
