import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Correction de la finale...\n')

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

  // Récupérer les gagnants des demi-finales
  const demi1 = tournament.matches.find(m => m.matchNumber === 5)
  const demi2 = tournament.matches.find(m => m.matchNumber === 6)
  const finale = tournament.matches.find(m => m.matchNumber === 7)

  if (!demi1?.winnerId || !demi2?.winnerId) {
    console.log('❌ Les deux demi-finales doivent être terminées')
    return
  }

  if (!finale) {
    console.log('❌ Finale non trouvée')
    return
  }

  // Mettre à jour la finale
  await prisma.match.update({
    where: { id: finale.id },
    data: {
      teamAId: demi1.winnerId,
      teamBId: demi2.winnerId,
      status: 'SCHEDULED',
    },
  })

  const winner1 = demi1.winnerId === demi1.teamAId ? demi1.teamA : demi1.teamB
  const winner2 = demi2.winnerId === demi2.teamAId ? demi2.teamA : demi2.teamB

  console.log(`✅ Finale: ${winner1?.name} vs ${winner2?.name}`)
  console.log('\n✨ Finale programmée !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
