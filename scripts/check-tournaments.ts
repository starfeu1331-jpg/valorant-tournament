import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Liste des tournois:\n')

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' }
  })

  for (const tournament of tournaments) {
    console.log(`📌 ${tournament.name}`)
    console.log(`   ID: ${tournament.id}`)
    console.log(`   Statut: ${tournament.status}`)
    console.log(`   Jeu: ${tournament.game}`)
    console.log(`   Dates inscription: ${tournament.registrationOpenAt?.toLocaleDateString()} → ${tournament.registrationCloseAt?.toLocaleDateString()}`)
    console.log(`   Date début: ${tournament.startDate.toLocaleDateString()}`)
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
