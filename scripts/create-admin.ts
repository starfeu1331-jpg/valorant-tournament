import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Votre ID Discord configuré automatiquement
  const YOUR_DISCORD_ID = '375954351593750529'
  
  console.log('🚀 Création d\'un utilisateur admin...')

  const admin = await prisma.user.upsert({
    where: { discordId: YOUR_DISCORD_ID },
    update: {
      role: 'ADMIN',
    },
    create: {
      discordId: YOUR_DISCORD_ID,
      username: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin créé:', admin)
  console.log('')
  console.log('Connectez-vous avec ce compte Discord pour avoir les droits admin.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
