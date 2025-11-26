import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Nettoyage des données de test...')

  // Supprimer tous les matchs
  const deletedMatches = await prisma.match.deleteMany({})
  console.log(`  ✓ ${deletedMatches.count} matchs supprimés`)

  // Supprimer toutes les inscriptions de tournois
  const deletedTournamentTeams = await prisma.tournamentTeam.deleteMany({})
  console.log(`  ✓ ${deletedTournamentTeams.count} inscriptions supprimées`)

  // Supprimer tous les tournois
  const deletedTournaments = await prisma.tournament.deleteMany({})
  console.log(`  ✓ ${deletedTournaments.count} tournois supprimés`)

  // Supprimer tous les joueurs d'équipes
  const deletedTeamPlayers = await prisma.teamPlayer.deleteMany({})
  console.log(`  ✓ ${deletedTeamPlayers.count} joueurs d'équipes supprimés`)

  // Supprimer toutes les équipes
  const deletedTeams = await prisma.team.deleteMany({})
  console.log(`  ✓ ${deletedTeams.count} équipes supprimées`)

  // Supprimer tous les joueurs de test (ceux avec discordId commençant par "fake_")
  const deletedPlayers = await prisma.user.deleteMany({
    where: {
      discordId: {
        startsWith: 'fake_'
      }
    }
  })
  console.log(`  ✓ ${deletedPlayers.count} joueurs de test supprimés`)

  console.log('\n✨ Nettoyage terminé!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
