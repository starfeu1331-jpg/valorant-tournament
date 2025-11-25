# 🎮 Plateforme de Gestion de Tournois E-Sport

Une application web complète pour organiser et gérer des tournois e-sport (Valorant, League of Legends, CS2, etc.) avec authentification Discord, système de brackets automatique, et interface de gestion pour le staff.

## 📋 Fonctionnalités

### Pour les visiteurs
- 👀 Consulter la liste des tournois (en cours, à venir, terminés)
- 📊 Voir les détails d'un tournoi (équipes, brackets, matches, scores)
- 🏆 Visualiser les brackets en temps réel

### Pour les joueurs (authentifiés)
- 🔐 Connexion via Discord OAuth
- 👥 Créer et gérer son équipe
- ✍️ S'inscrire aux tournois
- 📈 Suivre ses matches et résultats

### Pour le staff (membres du serveur Discord staff)
- ⚡ Dashboard de gestion complet
- 🏟️ Créer et configurer des tournois
- ✅ Valider ou refuser les inscriptions d'équipes
- 🎯 Générer automatiquement les brackets (simple élimination)
- 📝 Gérer les matches et entrer les scores
- 🔒 Actions tracées dans un journal de logs

### Pour les admins
- 👑 Tous les droits staff
- 🛠️ Gestion des utilisateurs et permissions

## 🛠️ Stack Technique

- **Framework**: Next.js 14+ avec App Router
- **Langage**: TypeScript
- **Base de données**: SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Authentification**: NextAuth.js avec Discord OAuth
- **Styling**: Tailwind CSS
- **Vérification staff**: API Discord Bot

## 📦 Prérequis

- Node.js 18+ 
- npm ou pnpm
- Un compte Discord Developer pour créer une application OAuth
- Un bot Discord pour la vérification des membres staff

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd SITE\ VALORANT
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env`:

```bash
cp .env.example .env
```

Puis éditez `.env` avec vos valeurs:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl"

# Discord OAuth (https://discord.com/developers/applications)
DISCORD_CLIENT_ID="votre-client-id"
DISCORD_CLIENT_SECRET="votre-client-secret"

# Discord Bot & Staff Verification
DISCORD_BOT_TOKEN="votre-bot-token"
DISCORD_STAFF_GUILD_ID="id-du-serveur-discord-staff"
```

### 4. Configuration Discord

#### A. Créer une application Discord OAuth

1. Allez sur https://discord.com/developers/applications
2. Créez une nouvelle application
3. Dans **OAuth2** → **General**:
   - Notez le `Client ID` et `Client Secret`
   - Ajoutez l'URL de redirection: `http://localhost:3000/api/auth/callback/discord`
4. Dans **OAuth2** → **URL Generator**, sélectionnez:
   - Scopes: `identify`, `email`, `guilds`
   - Copiez l'URL générée pour tester

#### B. Créer un bot Discord

1. Dans la même application, allez dans **Bot**
2. Créez un bot et copiez le **Token**
3. Activez **Server Members Intent** (obligatoire)
4. Invitez le bot sur votre serveur staff
5. Copiez l'ID de votre serveur Discord staff (clic droit → Copier l'identifiant du serveur)

#### C. Générer NEXTAUTH_SECRET

```bash
# Windows PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Linux/Mac
openssl rand -base64 32
```

### 5. Initialiser la base de données

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. (Optionnel) Créer un utilisateur admin

Créez un script `scripts/create-admin.ts`:

```typescript
import { prisma } from '../lib/prisma'

async function main() {
  const admin = await prisma.user.create({
    data: {
      username: 'Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      discordId: 'VOTRE_DISCORD_ID', // Votre ID Discord
    },
  })
  console.log('Admin créé:', admin)
}

main()
```

Puis exécutez:

```bash
npx tsx scripts/create-admin.ts
```

### 7. Lancer le projet

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

## 📚 Guide d'utilisation

### Flux utilisateur joueur

1. **Se connecter**: Cliquez sur "Se connecter avec Discord"
2. **Créer une équipe**: (À venir - fonctionnalité en développement)
3. **S'inscrire à un tournoi**: (À venir - fonctionnalité en développement)
4. **Suivre ses matches**: Consultez vos tournois dans votre dashboard

### Flux utilisateur staff

1. **Vérification automatique**: 
   - Le système vérifie automatiquement si vous êtes membre du serveur Discord staff
   - Si oui, votre rôle passe à `STAFF` automatiquement

2. **Accéder au dashboard**:
   - Allez sur `/staff` (protégé par middleware)
   - Vous voyez vos statistiques et la liste des tournois

3. **Créer un tournoi**:
   - Cliquez sur "Créer un tournoi"
   - Remplissez le formulaire:
     - Nom, jeu, description, règlement
     - Nombre d'équipes max
     - Format (simple élimination)
     - Format des matches (BO1, BO3, BO5)
     - Dates d'inscription et de début
     - Option Pick & Ban
   - Validez

4. **Gérer un tournoi**:
   - Cliquez sur "Gérer" sur un tournoi
   - **Valider les équipes**:
     - Les équipes inscrites apparaissent en "En attente"
     - Cliquez sur "Accepter" ou "Refuser" (avec motif)
   - **Changer le statut du tournoi**:
     - Utilisez le sélecteur pour passer de "À venir" à "Inscriptions ouvertes", "En cours", ou "Terminé"
   - **Générer le bracket**:
     - Une fois au moins 2 équipes acceptées
     - Cliquez sur "Générer le bracket"
     - Le système crée automatiquement tous les matches en simple élimination
   - **Gérer les matches**:
     - Consultez les matches par round
     - Cliquez sur "Gérer" pour entrer les scores

5. **Logs d'actions**:
   - Toutes vos actions sont automatiquement enregistrées
   - Traçabilité complète pour audit

### Flux admin

- Mêmes fonctionnalités que le staff
- Peut promouvoir d'autres utilisateurs en staff/admin (à implémenter si besoin)

## 🗂️ Structure du projet

```
SITE VALORANT/
├── app/                          # App Router Next.js
│   ├── api/auth/[...nextauth]/   # Route NextAuth
│   ├── auth/                     # Pages d'authentification
│   ├── staff/                    # Dashboard staff
│   │   └── tournaments/          # Gestion des tournois
│   ├── tournaments/              # Pages publiques tournois
│   ├── layout.tsx                # Layout racine
│   └── page.tsx                  # Page d'accueil
├── components/                   # Composants React
│   ├── providers/                # Providers (Auth, etc.)
│   ├── staff/                    # Composants staff
│   ├── tournaments/              # Composants tournois
│   └── ui/                       # Composants UI génériques
├── lib/                          # Logique métier
│   ├── actions/                  # Server Actions
│   │   ├── staff.ts              # Actions staff
│   │   └── tournaments.ts        # Actions tournois
│   ├── auth.ts                   # Configuration NextAuth
│   ├── discord.ts                # Intégration Discord Bot
│   ├── prisma.ts                 # Client Prisma
│   └── utils.ts                  # Utilitaires
├── prisma/
│   └── schema.prisma             # Schéma base de données
├── middleware.ts                 # Middleware de protection
├── .env.example                  # Template variables d'environnement
└── README.md                     # Ce fichier
```

## 🔒 Sécurité

- ✅ Authentification obligatoire pour les actions sensibles
- ✅ Vérification du rôle côté serveur (jamais côté client uniquement)
- ✅ Middleware de protection des routes `/staff`
- ✅ Validation des données d'entrée
- ✅ Sessions sécurisées avec NextAuth
- ✅ Logs d'actions staff pour audit

## 🗃️ Base de données

Le schéma Prisma comprend:

- **User**: Utilisateurs (Discord ID, rôle, etc.)
- **Account/Session**: Gestion NextAuth
- **Team**: Équipes (nom, tag, logo, joueurs)
- **TeamPlayer**: Joueurs d'une équipe
- **Tournament**: Tournois (nom, jeu, format, dates)
- **TournamentTeam**: Inscriptions d'équipes aux tournois
- **Match**: Matches (bracket, scores, horaires)
- **PickBan**: Système pick & ban (à développer)
- **PickBanAction**: Actions de pick & ban
- **StaffActionLog**: Historique des actions staff

## 🚧 Fonctionnalités à développer

### Priorité haute
- [ ] Page de création d'équipe pour les joueurs
- [ ] Page d'inscription d'une équipe à un tournoi
- [ ] Dashboard joueur avec ses équipes et tournois
- [ ] Système pick & ban complet avec interface
- [ ] Gestion complète des scores et avancement du bracket

### Priorité moyenne
- [ ] Double élimination
- [ ] Round Robin
- [ ] Notifications (Discord webhooks, emails)
- [ ] Upload d'images (logos d'équipes, preuves de score)
- [ ] Chat / commentaires sur les matches

### Améliorations
- [ ] Tests unitaires et d'intégration
- [ ] Mode sombre
- [ ] Internationalisation (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Export des résultats en PDF
- [ ] Statistiques avancées

## 🐛 Debug & Développement

### Inspecter la base de données

```bash
npx prisma studio
```

### Réinitialiser la base

```bash
npx prisma migrate reset
```

### Logs

- Les requêtes Prisma sont loguées en mode développement
- Vérifiez la console serveur pour les erreurs d'authentification Discord
- Les erreurs sont capturées et affichées dans l'interface

## 📝 Migration vers PostgreSQL (Production)

1. Changez `DATABASE_URL` dans `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/esport_tournaments"
```

2. Modifiez `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // au lieu de "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Recréez les migrations:

```bash
npx prisma migrate dev
```

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues!

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails

## 💬 Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

## 🙏 Remerciements

- Next.js team pour l'excellent framework
- Prisma team pour l'ORM
- NextAuth.js team pour la solution d'authentification
- La communauté Discord pour l'API

---

**Créé avec ❤️ pour la communauté e-sport**
