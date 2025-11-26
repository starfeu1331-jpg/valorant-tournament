import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Réinitialisation des demi-finales et finale...\n')

  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Test Edition' } },
  })

  if (!tournament) {
    console.log('❌ Tournoi non trouvé')
    return
  }

  // Réinitialiser les demi-finales (matchNumber 5 et 6)
  await prisma.match.updateMany({
    where: {
      tournamentId: tournament.id,
      matchNumber: { in: [5, 6] },
    },
    data: {
      scoreTeamA: 0,
      scoreTeamB: 0,
      status: 'SCHEDULED',
      winnerId: null,
    },
  })

  // Réinitialiser la finale (matchNumber 7)
  await prisma.match.updateMany({
    where: {
      tournamentId: tournament.id,
      matchNumber: 7,
    },
    data: {
      teamAId: null,
      teamBId: null,
      scoreTeamA: 0,
      scoreTeamB: 0,
      status: 'SCHEDULED',
      winnerId: null,
    },
  })

  console.log('✅ Demi-finale 1 réinitialisée (Phantom Force vs Cyber Ninjas)')
  console.log('✅ Demi-finale 2 réinitialisée (Ice Legends vs Steel Titans)')
  console.log('✅ Finale réinitialisée (en attente des gagnants)')
  console.log('\n✨ Prêt à tester la progression automatique du bracket !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
