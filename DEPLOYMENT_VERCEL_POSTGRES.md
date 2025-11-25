# Déploiement sur Vercel avec PostgreSQL

## Problème actuel
SQLite (`file:./dev.db`) ne fonctionne pas sur Vercel car le système de fichiers est en lecture seule.

## Solution : Utiliser Vercel Postgres

### 1. Créer une base de données Postgres sur Vercel

1. Allez sur votre dashboard Vercel
2. Sélectionnez votre projet `valorant-tournament`
3. Allez dans l'onglet **Storage**
4. Cliquez sur **Create Database**
5. Sélectionnez **Postgres**
6. Suivez les instructions (choisir une région proche : Europe West pour la France)

### 2. Configurer les variables d'environnement

Une fois la base créée, Vercel ajoute automatiquement ces variables :
- `POSTGRES_URL` (utilisez celui-ci)
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

Dans **Settings** → **Environment Variables**, ajoutez aussi :

```
DATABASE_URL=${POSTGRES_PRISMA_URL}
NEXTAUTH_SECRET=votre-secret-production-securise
NEXTAUTH_URL=https://votre-app.vercel.app
DISCORD_CLIENT_ID=votre-id
DISCORD_CLIENT_SECRET=votre-secret
```

### 3. Modifier le schema Prisma pour PostgreSQL

Modifiez `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"  // Changé de "sqlite" à "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Adaptations pour PostgreSQL

Certains types SQLite doivent être modifiés :

**Avant (SQLite):**
```prisma
model User {
  id String @id @default(cuid())
  // ...
}
```

**Après (PostgreSQL):** - Aucun changement nécessaire, `cuid()` fonctionne sur les deux !

### 5. Redéployer

```bash
# Commiter les changements
git add .
git commit -m "🔧 Configure PostgreSQL for Vercel deployment"
git push

# Vercel déploiera automatiquement
```

### 6. Vérifier le déploiement

Une fois déployé :
1. Vercel exécutera automatiquement `prisma db push` pendant le build
2. La base de données sera créée automatiquement
3. Vous aurez besoin de seed les données initiales (admin, etc.)

## Alternative : Garder SQLite en dev + Postgres en prod

Vous pouvez garder SQLite en local et PostgreSQL en production en utilisant un provider conditionnel :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Et dans vos `.env` :
- **Local** : `DATABASE_URL="file:./dev.db"`
- **Vercel** : `DATABASE_URL="${POSTGRES_PRISMA_URL}"`

⚠️ Mais Prisma générera le client pour PostgreSQL, donc testez bien en dev !

## Recommandation finale

**Utilisez PostgreSQL partout** (dev + prod) pour éviter les différences de comportement :

1. Installez PostgreSQL localement : https://www.postgresql.org/download/
2. Créez une DB locale : `createdb valorant_tournament_dev`
3. `.env` local : `DATABASE_URL="postgresql://user:password@localhost:5432/valorant_tournament_dev"`
4. Vercel : `DATABASE_URL="${POSTGRES_PRISMA_URL}"`

---

## Checklist de déploiement

- [ ] Base Postgres créée sur Vercel
- [ ] Variables d'environnement configurées
- [ ] `schema.prisma` modifié pour PostgreSQL
- [ ] Code poussé sur GitHub
- [ ] Déploiement Vercel réussi
- [ ] Base de données migrée
- [ ] Créer un admin de test en production
