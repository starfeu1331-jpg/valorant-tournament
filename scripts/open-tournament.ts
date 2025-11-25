import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tournamentName = process.argv[2]
  
  if (!tournamentName) {
    console.log('❌ Usage: npm run open-tournament "Nom du tournoi"')
    process.exit(1)
  }

  const tournament = await prisma.tournament.findFirst({
    where: {
      name: {
        contains: tournamentName
      }
    }
  })

  if (!tournament) {
    console.log(`❌ Tournoi "${tournamentName}" non trouvé`)
    process.exit(1)
  }

  await prisma.tournament.update({
    where: { id: tournament.id },
    data: { status: 'REGISTRATION_OPEN' }
  })

  console.log(`✅ Inscriptions ouvertes pour "${tournament.name}"`)
  console.log(`   Statut: ${tournament.status} → REGISTRATION_OPEN`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
