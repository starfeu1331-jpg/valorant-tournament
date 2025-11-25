import axios from 'axios'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Vérifie si un utilisateur Discord est membre du serveur staff
 * @param discordId - L'ID Discord de l'utilisateur
 * @returns true si l'utilisateur est membre du serveur staff
 */
export async function verifyStaffRole(discordId: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN
  const guildId = process.env.DISCORD_STAFF_GUILD_ID

  if (!botToken || !guildId) {
    console.warn('DISCORD_BOT_TOKEN ou DISCORD_STAFF_GUILD_ID non configuré')
    return false
  }

  try {
    // Vérifier si l'utilisateur est membre du serveur
    const response = await axios.get(
      `${DISCORD_API_BASE}/guilds/${guildId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    )

    // Si la requête réussit, l'utilisateur est membre
    return response.status === 200
  } catch (error: any) {
    if (error.response?.status === 404) {
      // L'utilisateur n'est pas membre du serveur
      return false
    }
    console.error('Erreur lors de la vérification du rôle staff:', error)
    return false
  }
}

/**
 * Récupère les informations d'un utilisateur Discord
 * @param discordId - L'ID Discord de l'utilisateur
 */
export async function getDiscordUser(discordId: string) {
  const botToken = process.env.DISCORD_BOT_TOKEN

  if (!botToken) {
    throw new Error('DISCORD_BOT_TOKEN non configuré')
  }

  try {
    const response = await axios.get(`${DISCORD_API_BASE}/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    })

    return response.data
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur Discord:', error)
    throw error
  }
}
