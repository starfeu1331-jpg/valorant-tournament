# 🚀 Déploiement sur Vercel (RECOMMANDÉ)

## Étape 1 : Préparer le projet

### 1.1 Installer Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Créer un compte GitHub (si pas déjà fait)
- Va sur https://github.com
- Crée un compte gratuit

### 1.3 Initialiser Git dans ton projet
```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.4 Créer un repo GitHub
```bash
# Sur GitHub, crée un nouveau repo "valorant-tournament"
# Puis :
git remote add origin https://github.com/TON-USERNAME/valorant-tournament.git
git branch -M main
git push -u origin main
```

## Étape 2 : Configurer Vercel

### 2.1 Créer un compte Vercel
- Va sur https://vercel.com
- Clique "Sign up" → "Continue with GitHub"
- Autorise Vercel à accéder à tes repos

### 2.2 Importer le projet
1. Dashboard Vercel → "Add New" → "Project"
2. Sélectionne ton repo `valorant-tournament`
3. Configure :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./`
   - **Build Command** : `npm run build` (détecté auto)
   - **Output Directory** : `.next` (détecté auto)

### 2.3 Ajouter les variables d'environnement
Dans les settings du projet Vercel, ajoute :

```env
# Discord OAuth
DISCORD_CLIENT_ID=ton_client_id
DISCORD_CLIENT_SECRET=ton_client_secret
NEXTAUTH_URL=https://ton-domaine.com
NEXTAUTH_SECRET=génère_avec_openssl_rand_-base64_32

# Database (Vercel Postgres)
POSTGRES_URL="************"
POSTGRES_PRISMA_URL="************"
POSTGRES_URL_NON_POOLING="************"

# Valorant API
HENRIK_API_KEY=HDEV-63f5fc62-e2b5-4dab-be10-eeaf4d4fb4a7
```

## Étape 3 : Configurer la base de données

### 3.1 Activer Vercel Postgres
1. Dans ton projet Vercel → Onglet "Storage"
2. "Create Database" → "Postgres"
3. Vercel génère automatiquement les URLs de connexion

### 3.2 Migrer de SQLite à PostgreSQL

#### Modifier `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

#### Créer les tables :
```bash
npx prisma migrate deploy
```

### 3.3 Seed initial (optionnel)
```bash
# Localement avec la DB Vercel
npm run db:seed
```

## Étape 4 : Connecter ton domaine OVH

### 4.1 Dans Vercel
1. Settings du projet → "Domains"
2. Ajoute `ton-domaine.com`
3. Vercel te donne des DNS à configurer

### 4.2 Dans OVH
1. Va sur ton espace client OVH
2. Domaines → Ton domaine → Zone DNS
3. Ajoute/modifie les entrées :

```
Type: A
Nom: @
Valeur: 76.76.21.21 (IP Vercel)

Type: CNAME  
Nom: www
Valeur: cname.vercel-dns.com
```

4. Attends 10-30 minutes pour la propagation DNS

## Étape 5 : Workflow de modification

### Quand tu veux modifier avec moi :
```bash
# 1. Je fais les modifications dans VS Code
# 2. Tu commit et push :
git add .
git commit -m "Description des changements"
git push

# 3. Vercel redéploie automatiquement en 30s !
```

### Voir les logs en temps réel :
```bash
vercel logs
```

## ✅ Avantages de cette méthode

- ✅ **Gratuit** (plan hobby Vercel)
- ✅ **HTTPS automatique**
- ✅ **CDN mondial** (site rapide partout)
- ✅ **Preview deployments** : Chaque PR GitHub = URL de test
- ✅ **Rollback facile** : Retour à une version précédente en 1 clic
- ✅ **Base de données PostgreSQL incluse**
- ✅ **Je peux modifier avec toi facilement via Git**

## 🔧 Commandes utiles

```bash
# Déployer manuellement (si besoin)
vercel --prod

# Tester en local avec la DB de prod
vercel env pull .env.local
npm run dev

# Voir les logs de production
vercel logs --follow

# Rollback à la version précédente
# (via dashboard Vercel → Deployments → "Promote to Production")
```

## 🆘 Debugging

### Erreur "Database migration failed"
```bash
# Se connecter à la DB Vercel
npx prisma studio --url="$POSTGRES_PRISMA_URL"

# Forcer la migration
npx prisma migrate deploy
```

### Erreur Discord OAuth
- Vérifie que `NEXTAUTH_URL` = ton domaine exact
- Dans Discord Developer Portal, ajoute ton domaine dans "Redirects"

### Site lent au premier chargement
- Normal sur plan gratuit (cold start)
- Upgrade vers plan Pro si besoin ($20/mois)

## 🔐 Sécurité

⚠️ **IMPORTANT** : Ne commit JAMAIS les secrets dans Git !

Crée un `.gitignore` (déjà présent normalement) :
```
.env
.env.local
.env*.local
dev.db
dev.db-journal
```

---

**Prochaines étapes après déploiement :**
1. Teste l'inscription/connexion Discord
2. Crée un admin avec le script : `npm run create-admin`
3. Teste la création d'équipe et de tournoi
4. Configure les notifications Discord (prochaine feature !)
