import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Création de données de test...')

  // Créer un tournoi de test
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Championnat Valorant Test',
      game: 'Valorant',
      description: 'Tournoi de test pour démonstration',
      rules: '1. Soyez fair-play\n2. Respectez les horaires\n3. Pas de triche',
      maxTeams: 8,
      format: 'SINGLE_ELIMINATION',
      matchFormat: 'BO3',
      status: 'REGISTRATION_OPEN',
      registrationOpenAt: new Date(),
      registrationCloseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // +10 jours
      pickBanEnabled: true,
    },
  })

  console.log('✅ Tournoi créé:', tournament.name)

  // Créer des équipes de test
  const teams = []
  for (let i = 1; i <= 4; i++) {
    const team = await prisma.team.create({
      data: {
        name: `Team ${i}`,
        tag: `TM${i}`,
        game: 'Valorant',
        description: `Équipe de test ${i}`,
        owner: {
          create: {
            username: `Player${i}`,
            email: `player${i}@example.com`,
            role: 'PLAYER',
          },
        },
      },
    })
    teams.push(team)
    console.log(`✅ Équipe créée: ${team.name}`)
  }

  // Inscrire les équipes au tournoi
  for (const team of teams) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: 'PENDING',
      },
    })
  }

  console.log('✅ Équipes inscrites au tournoi')
  console.log('')
  console.log('🎉 Données de test créées avec succès!')
  console.log(`   - 1 tournoi: ${tournament.name}`)
  console.log(`   - 4 équipes inscrites`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
