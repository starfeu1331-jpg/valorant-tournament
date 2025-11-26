import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 État des matches du tournoi de test\n')

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
    console.log('❌ Tournoi de test non trouvé')
    return
  }

  console.log(`🏆 ${tournament.name}\n`)

  tournament.matches.forEach((match) => {
    const teamAName = match.teamA?.name || '??? (À déterminer)'
    const teamBName = match.teamB?.name || '??? (À déterminer)'
    const score = match.scoreTeamA !== null && match.scoreTeamB !== null 
      ? `${match.scoreTeamA} - ${match.scoreTeamB}` 
      : 'Pas de score'
    const winner = match.winnerId 
      ? (match.winnerId === match.teamAId ? match.teamA?.name : match.teamB?.name)
      : 'Aucun'

    console.log(`${match.round} (#${match.matchNumber})`)
    console.log(`  ${teamAName} vs ${teamBName}`)
    console.log(`  Score: ${score}`)
    console.log(`  Statut: ${match.status}`)
    console.log(`  Gagnant: ${winner}`)
    console.log('')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
