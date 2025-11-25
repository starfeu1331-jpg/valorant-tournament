import { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { verifyStaffRole } from './discord'
import type { Adapter } from 'next-auth/adapters'

// Adapter personnalisé qui gère correctement le mapping des champs
function CustomPrismaAdapter(p: typeof prisma): Adapter {
  const baseAdapter = PrismaAdapter(p)
  
  return {
    ...baseAdapter,
    async createUser(data: any) {
      // Vérifier si l'utilisateur existe déjà avec ce discordId
      const discordId = (data as any).discordId
      if (discordId) {
        const existingUser = await p.user.findUnique({
          where: { discordId },
        })

        if (existingUser) {
          // Mettre à jour l'utilisateur existant
          return await p.user.update({
            where: { id: existingUser.id },
            data: {
              email: data.email,
              emailVerified: data.emailVerified,
              image: data.image,
              username: (data as any).username || (data as any).name || existingUser.username,
            },
          })
        }
      }

      // Créer un nouvel utilisateur
      return await p.user.create({
        data: {
          email: data.email!,
          emailVerified: data.emailVerified,
          image: data.image,
          username: (data as any).username || (data as any).name || 'User',
          discordId: (data as any).discordId || '',
          role: (data as any).role || 'PLAYER',
        },
      })
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email guilds' } },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          username: profile.username,
          discordId: profile.id,
          role: 'PLAYER',
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Vérification et mise à jour du rôle staff lors de la connexion
      if (account?.provider === 'discord' && account.providerAccountId) {
        try {
          const isStaff = await verifyStaffRole(account.providerAccountId)
          
          // Rechercher l'utilisateur existant
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { discordId: account.providerAccountId },
                { email: user.email || undefined },
              ],
            },
          })

          if (existingUser) {
            // Mise à jour du rôle utilisateur existant
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                role: isStaff ? 'STAFF' : 'PLAYER',
                discordId: account.providerAccountId,
                username: (profile as any)?.username || user.name || 'User',
                image: user.image,
              },
            })
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du rôle staff:', error)
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role || 'PLAYER'
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
}
