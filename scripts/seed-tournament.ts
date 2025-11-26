import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎮 Création du tournoi de test...')

  // Trouver un utilisateur admin pour créer le tournoi
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

  if (!adminUser) {
    console.error('❌ Aucun utilisateur admin trouvé. Créez un admin d\'abord.')
    return
  }

  console.log(`✅ Admin trouvé: ${adminUser.username}`)

  // Créer 40 joueurs (8 équipes x 5 joueurs)
  const playerNames = [
    // Team 1: Phantom Force
    'ShadowStrike', 'GhostReaper', 'DarkPhantom', 'NightHawk', 'VoidWalker',
    // Team 2: Dragon Warriors
    'DragonSlayer', 'FireBreath', 'ScaleLord', 'WingCommander', 'DrakeHunter',
    // Team 3: Cyber Ninjas
    'ByteBlade', 'PixelAssassin', 'DataNinja', 'CodeSamurai', 'HackerKage',
    // Team 4: Thunder Strikers
    'LightningFast', 'ThunderBolt', 'StormRider', 'ShockWave', 'VoltMaster',
    // Team 5: Ice Legends
    'FrostBite', 'GlacierKing', 'SnowStorm', 'IceBreaker', 'PolarVortex',
    // Team 6: Phoenix Rising
    'FirePhoenix', 'AshReborn', 'FlameSoul', 'InfernoWing', 'BlazeRider',
    // Team 7: Venom Squad
    'ToxicStrike', 'PoisonFang', 'VenomBlade', 'ViperShot', 'DeadlyDose',
    // Team 8: Steel Titans
    'IronFist', 'SteelGuard', 'MetalCore', 'TitanShield', 'ArmorBreaker',
  ]

  const players = []
  console.log('👥 Création des 40 joueurs...')
  
  for (const name of playerNames) {
    const player = await prisma.user.create({
      data: {
        username: name,
        discordId: `fake_${Math.random().toString(36).substring(7)}`,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        role: 'PLAYER',
      },
    })
    players.push(player)
    console.log(`  ✓ ${name}`)
  }

  // Créer 8 équipes
  const teamData = [
    { name: 'Phantom Force', tag: 'PHF', color: '#9333ea' },
    { name: 'Dragon Warriors', tag: 'DRG', color: '#dc2626' },
    { name: 'Cyber Ninjas', tag: 'CYB', color: '#06b6d4' },
    { name: 'Thunder Strikers', tag: 'THN', color: '#eab308' },
    { name: 'Ice Legends', tag: 'ICE', color: '#3b82f6' },
    { name: 'Phoenix Rising', tag: 'PHX', color: '#f97316' },
    { name: 'Venom Squad', tag: 'VNM', color: '#22c55e' },
    { name: 'Steel Titans', tag: 'STL', color: '#64748b' },
  ]

  const teams = []
  console.log('\n🏆 Création des 8 équipes...')

  for (let i = 0; i < teamData.length; i++) {
    const teamPlayers = players.slice(i * 5, (i + 1) * 5)
    
    const team = await prisma.team.create({
      data: {
        name: teamData[i].name,
        tag: teamData[i].tag,
        game: 'VALORANT',
        ownerId: teamPlayers[0].id, // Le premier joueur est le capitaine
      },
    })

    // Ajouter les joueurs à l'équipe
    await prisma.teamPlayer.createMany({
      data: teamPlayers.map((player, idx) => ({
        teamId: team.id,
        userId: player.id,
        role: idx === 0 ? 'Capitaine' : idx === 1 ? 'IGL' : idx === 2 ? 'Duelist' : idx === 3 ? 'Controller' : 'Sentinel',
      })),
    })

    teams.push(team)
    console.log(`  ✓ ${teamData[i].name} [${teamData[i].tag}] - 5 joueurs`)
  }

  // Créer le tournoi
  console.log('\n🎯 Création du tournoi...')
  const now = new Date()
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Valorant Championship Series - Test Edition',
      game: 'Valorant',
      description: 'Tournoi de test avec 8 équipes professionnelles. Format simple élimination, Best of 3.',
      rules: `
# Règlement du tournoi

## Format
- Simple élimination
- Best of 3 (BO3)
- 8 équipes participantes

## Règles générales
1. Tous les joueurs doivent être présents 15 minutes avant le match
2. Les pauses sont limitées à 5 minutes par match
3. Aucun bug exploit autorisé
4. Communication vocale requise

## Maps
- Les maps seront déterminées par le système Pick & Ban
- Chaque équipe ban 2 maps
- Chaque équipe pick 1 map
- La map décisive (si nécessaire) sera aléatoire

## Sanctions
- Retard: Warning puis forfeit après 10 minutes
- Comportement antisportif: Disqualification immédiate
- Triche: Ban permanent
      `.trim(),
      maxTeams: 8,
      format: 'SINGLE_ELIMINATION',
      matchFormat: 'BO3',
      status: 'ONGOING',
      registrationOpenAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      registrationCloseAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
      startDate: now,
      pickBanEnabled: true,
    },
  })

  console.log(`  ✓ ${tournament.name}`)

  // Inscrire toutes les équipes et les accepter
  console.log('\n📝 Inscription des équipes...')
  for (const team of teams) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: 'ACCEPTED',
        registeredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
      },
    })
    console.log(`  ✓ ${team.name} inscrite et acceptée`)
  }

  // Générer le bracket (quarts de finale)
  console.log('\n🎲 Génération du bracket...')
  
  const matches = [
    // Quarts de finale - TOUTES LES 8 ÉQUIPES
    { round: 'Quarts de finale', teamA: teams[0], teamB: teams[1], matchNumber: 1 },
    { round: 'Quarts de finale', teamA: teams[2], teamB: teams[3], matchNumber: 2 },
    { round: 'Quarts de finale', teamA: teams[4], teamB: teams[5], matchNumber: 3 },
    { round: 'Quarts de finale', teamA: teams[6], teamB: teams[7], matchNumber: 4 },
    // Demi-finales (sans équipes pour l'instant)
    { round: 'Demi-finale', teamA: null, teamB: null, matchNumber: 5 },
    { round: 'Demi-finale', teamA: null, teamB: null, matchNumber: 6 },
    // Finale
    { round: 'Finale', teamA: null, teamB: null, matchNumber: 7 },
  ]

  for (const matchData of matches) {
    const match = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: matchData.round,
        matchNumber: matchData.matchNumber,
        status: matchData.teamA && matchData.teamB ? 'SCHEDULED' : 'SCHEDULED',
        teamAId: matchData.teamA?.id,
        teamBId: matchData.teamB?.id,
        scoreTeamA: 0,
        scoreTeamB: 0,
        scheduledAt: matchData.teamA && matchData.teamB 
          ? new Date(now.getTime() + matchData.matchNumber * 2 * 60 * 60 * 1000) // Espacés de 2h
          : null,
      },
    })
    
    if (matchData.teamA && matchData.teamB) {
      console.log(`  ✓ ${matchData.round}: ${matchData.teamA.name} vs ${matchData.teamB.name}`)
    } else {
      console.log(`  ✓ ${matchData.round}: À déterminer`)
    }
  }

  console.log('\n✨ Tournoi de test créé avec succès!')
  console.log(`\n📊 Résumé:`)
  console.log(`   - 40 joueurs créés`)
  console.log(`   - 8 équipes créées (5 joueurs chacune)`)
  console.log(`   - 1 tournoi créé: "${tournament.name}"`)
  console.log(`   - 7 matches générés (4 quarts, 2 demis, 1 finale)`)
  console.log(`\n🔗 Accédez au tournoi: http://localhost:3000/tournaments/${tournament.id}`)
  console.log(`🔗 Gestion staff: http://localhost:3000/staff/tournaments/${tournament.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
