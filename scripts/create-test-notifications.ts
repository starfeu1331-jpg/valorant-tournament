import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Récupérer un utilisateur (le premier trouvé)
  const user = await prisma.user.findFirst()

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Connecte-toi d\'abord !')
    return
  }

  console.log(`✅ Utilisateur trouvé: ${user.username}`)

  // Créer des notifications de test
  const notifications = [
    {
      userId: user.id,
      type: 'TEAM_VALIDATED',
      title: '✅ Équipe acceptée !',
      message: 'Votre équipe "Team Test" a été acceptée pour le tournoi "Valorant Championship"',
      read: false,
      relatedId: null,
    },
    {
      userId: user.id,
      type: 'REGISTRATION_SUBMITTED',
      title: '📝 Inscription en attente',
      message: 'Votre équipe "Dream Team" a été inscrite au tournoi. Elle est maintenant en attente de validation.',
      read: false,
      relatedId: null,
    },
    {
      userId: user.id,
      type: 'MATCH_SCHEDULED',
      title: '📅 Match programmé',
      message: 'Votre prochain match est prévu pour demain à 18h00',
      read: true,
      relatedId: null,
    },
  ]

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif })
    console.log(`✅ Notification créée: ${notif.title}`)
  }

  console.log('\n🎉 3 notifications de test créées avec succès !')
  console.log('👉 Rafraîchis la page pour voir la pastille rouge sur ta photo de profil !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
