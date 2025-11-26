import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Correction du bracket...\n')

  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Test Edition' } },
    include: {
      matches: {
        include: {
          teamA: true,
          teamB: true,
        },
        orderBy: { matchNumber: 'asc' },
      },
    },
  })

  if (!tournament) {
    console.log('❌ Tournoi non trouvé')
    return
  }

  // Récupérer les gagnants des quarts
  const quart1 = tournament.matches.find(m => m.matchNumber === 1)
  const quart2 = tournament.matches.find(m => m.matchNumber === 2)
  const quart3 = tournament.matches.find(m => m.matchNumber === 3)
  const quart4 = tournament.matches.find(m => m.matchNumber === 4)

  const demi1 = tournament.matches.find(m => m.matchNumber === 5)
  const demi2 = tournament.matches.find(m => m.matchNumber === 6)

  if (!quart1?.winnerId || !quart2?.winnerId || !quart3?.winnerId || !quart4?.winnerId) {
    console.log('❌ Tous les quarts de finale doivent être terminés')
    return
  }

  // Mettre à jour demi-finale 1
  if (demi1) {
    await prisma.match.update({
      where: { id: demi1.id },
      data: {
        teamAId: quart1.winnerId,
        teamBId: quart2.winnerId,
        status: 'SCHEDULED',
      },
    })
    console.log(`✅ Demi-finale 1: ${quart1.teamA?.name || quart1.teamB?.name} vs ${quart2.teamA?.name || quart2.teamB?.name}`)
  }

  // Mettre à jour demi-finale 2
  if (demi2) {
    await prisma.match.update({
      where: { id: demi2.id },
      data: {
        teamAId: quart3.winnerId,
        teamBId: quart4.winnerId,
        status: 'SCHEDULED',
      },
    })
    console.log(`✅ Demi-finale 2: ${quart3.teamA?.name || quart3.teamB?.name} vs ${quart4.teamA?.name || quart4.teamB?.name}`)
  }

  console.log('\n✨ Bracket corrigé !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
