# 🚀 Déploiement sur Vercel

Ce guide vous aide à déployer l'application sur Vercel avec PostgreSQL.

## Prérequis

- Un compte Vercel (gratuit)
- Un compte sur un service PostgreSQL:
  - **Vercel Postgres** (recommandé, intégré)
  - **Neon** (gratuit)
  - **Supabase** (gratuit)
  - **Railway** (gratuit avec limites)

## Étape 1: Préparer la base PostgreSQL

### Option A: Vercel Postgres (le plus simple)

1. Allez dans votre projet Vercel
2. Onglet **Storage**
3. Créez une base **Postgres**
4. Copiez la `DATABASE_URL`

### Option B: Neon

1. Allez sur https://neon.tech
2. Créez un projet
3. Copiez la `DATABASE_URL`

### Option C: Supabase

1. Allez sur https://supabase.com
2. Créez un projet
3. Allez dans **Settings** → **Database**
4. Copiez la **Connection string** (mode Transaction Pooling)

## Étape 2: Modifier le schéma Prisma pour PostgreSQL

Dans `prisma/schema.prisma`, changez:

```prisma
datasource db {
  provider = "postgresql"  // au lieu de "sqlite"
  url      = env("DATABASE_URL")
}
```

Supprimez les migrations SQLite existantes:

```bash
rm -rf prisma/migrations
```

## Étape 3: Déployer sur Vercel

### Via l'interface Vercel

1. Allez sur https://vercel.com/new
2. Importez votre repo GitHub
3. Configurez les variables d'environnement:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://user:password@host:5432/database

NEXTAUTH_URL=https://votre-app.vercel.app
NEXTAUTH_SECRET=générer-un-nouveau-secret-pour-prod

DISCORD_CLIENT_ID=votre-client-id
DISCORD_CLIENT_SECRET=votre-client-secret

DISCORD_BOT_TOKEN=votre-bot-token
DISCORD_STAFF_GUILD_ID=votre-guild-id

NODE_ENV=production
```

4. Dans **Settings** → **Functions**, ajoutez:
   - **Build Command**: `npx prisma generate && npm run build`
   - **Install Command**: `npm install`

5. Cliquez sur **Deploy**

### Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Suivez les instructions
```

## Étape 4: Appliquer les migrations

Une fois déployé, exécutez les migrations:

```bash
# Depuis votre machine locale
npx prisma migrate deploy
```

Ou créez un script de migration dans `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npx prisma generate && npx prisma migrate deploy && next build"
  }
}
```

## Étape 5: Configurer Discord pour la production

1. Allez sur https://discord.com/developers/applications
2. Dans votre application Discord OAuth:
3. **OAuth2** → **Redirects**, ajoutez:
   ```
   https://votre-app.vercel.app/api/auth/callback/discord
   ```

## Étape 6: Créer un admin en production

Créez un fichier `scripts/create-admin-prod.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const discordId = process.argv[2]
  
  if (!discordId) {
    console.error('Usage: npm run create:admin:prod YOUR_DISCORD_ID')
    process.exit(1)
  }

  const admin = await prisma.user.upsert({
    where: { discordId },
    update: { role: 'ADMIN' },
    create: {
      discordId,
      username: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  })

  console.log('✅ Admin créé:', admin)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Ajoutez dans `package.json`:

```json
{
  "scripts": {
    "create:admin:prod": "tsx scripts/create-admin-prod.ts"
  }
}
```

Exécutez:

```bash
DATABASE_URL="votre-url-postgres" npm run create:admin:prod VOTRE_DISCORD_ID
```

## Étape 7: Optimisations pour la production

### A. Ajouter un middleware de sécurité

Créez `lib/security.ts`:

```typescript
import { NextResponse } from 'next/server'

export function securityHeaders() {
  return {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'origin-when-cross-origin',
  }
}
```

Dans `middleware.ts`, ajoutez:

```typescript
import { securityHeaders } from './lib/security'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Ajouter les headers de sécurité
  Object.entries(securityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // ... reste du middleware
  
  return response
}
```

### B. Configurer les logs (Sentry)

```bash
npm install @sentry/nextjs
```

Créez `sentry.client.config.ts` et `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### C. Monitoring (Vercel Analytics)

Dans `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Étape 8: Configuration avancée

### Limiter les connexions Prisma

Pour éviter d'épuiser la pool de connexions PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  poolTimeout = 30
}
```

Dans `.env.production`:

```env
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...
```

### Cache avec Redis (optionnel)

Pour améliorer les performances:

```bash
npm install @vercel/kv
```

## Checklist de déploiement

Avant de déployer en production:

- [ ] Tester localement avec PostgreSQL
- [ ] Vérifier toutes les variables d'environnement
- [ ] Configurer Discord OAuth avec l'URL de production
- [ ] Appliquer les migrations sur la base de production
- [ ] Créer un compte admin
- [ ] Tester l'authentification Discord
- [ ] Tester la création de tournoi
- [ ] Tester la validation d'équipes
- [ ] Vérifier les logs d'erreur
- [ ] Configurer un système de monitoring
- [ ] Configurer les backups de la base de données
- [ ] Vérifier les limites de rate limiting
- [ ] Tester sur mobile

## Maintenance

### Backups

Configurez des backups automatiques de votre base PostgreSQL:

- **Vercel Postgres**: Backups automatiques inclus
- **Neon**: Backups quotidiens inclus
- **Supabase**: Backups configurables

### Monitoring

- Vercel Dashboard pour les métriques
- Sentry pour les erreurs
- Vercel Analytics pour le trafic
- PostgreSQL dashboard pour la base

### Mises à jour

```bash
# Localement, créer une nouvelle migration
npx prisma migrate dev --name nom-de-la-migration

# Déployer sur Vercel
git push origin main

# Les migrations seront appliquées automatiquement si configuré
```

## Troubleshooting

### Erreur "Too many connections"

Réduisez `connection_limit` dans DATABASE_URL:

```env
DATABASE_URL=postgresql://...?connection_limit=1
```

### Migrations qui échouent

Appliquez manuellement:

```bash
DATABASE_URL="votre-url" npx prisma migrate deploy
```

### Variables d'environnement non détectées

Vérifiez qu'elles sont bien configurées dans:
- Vercel Dashboard → Settings → Environment Variables
- Pour tous les environnements (Production, Preview, Development)

### Temps de build trop long

Optimisez les imports:

```typescript
// Évitez
import { Button } from '@/components/ui/button'

// Préférez des imports directs si possible
```

---

**Note**: Ce guide suppose que vous utilisez le plan gratuit de Vercel. Pour des volumes importants, envisagez un plan Pro.
