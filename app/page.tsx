import Link from 'next/link'
import { getTournaments } from '@/lib/actions/tournaments'
import { TournamentCard } from '@/components/tournaments/tournament-card'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const tournaments = await getTournaments()

  const registrationOpenTournaments = tournaments.filter(t => t.status === 'REGISTRATION_OPEN')
  const upcomingTournaments = tournaments.filter(t => t.status === 'UPCOMING')
  const ongoingTournaments = tournaments.filter(t => t.status === 'ONGOING')
  const completedTournaments = tournaments.filter(t => t.status === 'COMPLETED').slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Plateforme Tournois E-Sport</h1>
          <p className="text-xl mb-8">
            Rejoignez des tournois compétitifs, créez votre équipe et prouvez votre valeur
          </p>
          <div className="flex gap-4">
            <Link href="/tournaments">
              <Button size="lg" variant="secondary">
                Voir les tournois
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Registration Open Tournaments */}
      {registrationOpenTournaments.length > 0 && (
        <section className="py-12 bg-green-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-green-900">🔓 Inscriptions ouvertes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registrationOpenTournaments.map((tournament: any) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ongoing Tournaments */}
      {ongoingTournaments.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Tournois en cours</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ongoingTournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Tournois à venir</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Completed Tournaments */}
      {completedTournaments.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Tournois terminés</h2>
              <Link href="/tournaments?status=completed">
                <Button variant="outline">Voir tout</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Prêt à rejoindre l'action ?</h2>
          <p className="text-xl mb-8">
            Créez votre équipe et participez aux meilleurs tournois e-sport
          </p>
          <Link href="/tournaments">
            <Button size="lg" variant="secondary">
              Découvrir les tournois
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
