# 🏗️ Architecture de l'application

## Vue d'ensemble

L'application est construite avec une architecture moderne Next.js 14 utilisant l'App Router, suivant les principes de Server Components par défaut et Client Components quand nécessaire.

## Stack technique complète

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js 14)         │
│  ┌────────────────────────────────────┐ │
│  │  React Server Components (RSC)     │ │
│  │  - Pages tournois, dashboard       │ │
│  │  - Fetch de données côté serveur   │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Client Components                 │ │
│  │  - Boutons interactifs             │ │
│  │  - Formulaires avec état           │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      Server Actions (Next.js 14)        │
│  - createTournament()                   │
│  - validateTeam()                       │
│  - generateBracket()                    │
│  - updateMatchScore()                   │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│          Business Logic Layer           │
│  ┌────────────────────────────────────┐ │
│  │  Prisma ORM                        │ │
│  │  - Models & relations              │ │
│  │  - Queries & mutations             │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Discord Integration               │ │
│  │  - OAuth flow                      │ │
│  │  - Staff verification API          │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│        Database (SQLite / PostgreSQL)   │
│  - Users, Teams, Tournaments            │
│  - Matches, PickBan, Logs               │
└─────────────────────────────────────────┘
```

## Structure des dossiers détaillée

```
SITE VALORANT/
│
├── app/                          # App Router Next.js 14
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts      # NextAuth API route
│   │
│   ├── auth/                     # Pages d'authentification
│   │   ├── signin/
│   │   │   └── page.tsx         # Page de connexion Discord
│   │   └── error/
│   │       └── page.tsx         # Page d'erreur auth
│   │
│   ├── staff/                    # Dashboard staff (protégé)
│   │   ├── page.tsx             # Dashboard principal
│   │   └── tournaments/
│   │       ├── create/
│   │       │   └── page.tsx     # Créer un tournoi
│   │       └── [id]/
│   │           └── page.tsx     # Gérer un tournoi
│   │
│   ├── tournaments/              # Pages publiques tournois
│   │   ├── page.tsx             # Liste des tournois
│   │   └── [id]/
│   │       └── page.tsx         # Détail d'un tournoi
│   │
│   ├── layout.tsx               # Layout racine
│   ├── page.tsx                 # Page d'accueil
│   └── globals.css              # Styles globaux
│
├── components/                   # Composants React
│   ├── providers/
│   │   └── auth-provider.tsx    # Provider NextAuth
│   │
│   ├── staff/                   # Composants staff
│   │   ├── validate-team-button.tsx
│   │   ├── generate-bracket-button.tsx
│   │   └── update-status-button.tsx
│   │
│   ├── tournaments/             # Composants tournois
│   │   └── tournament-card.tsx
│   │
│   └── ui/                      # Composants UI génériques
│       ├── button.tsx
│       └── toaster.tsx
│
├── lib/                         # Logique métier
│   ├── actions/                 # Server Actions
│   │   ├── staff.ts            # Actions staff
│   │   └── tournaments.ts      # Actions tournois
│   │
│   ├── auth.ts                 # Configuration NextAuth
│   ├── discord.ts              # Intégration Discord Bot API
│   ├── prisma.ts               # Client Prisma singleton
│   └── utils.ts                # Fonctions utilitaires
│
├── prisma/
│   ├── schema.prisma           # Schéma de base de données
│   ├── dev.db                  # Base SQLite (dev)
│   └── migrations/             # Migrations Prisma
│
├── scripts/                    # Scripts d'administration
│   ├── create-admin.ts        # Créer un admin
│   └── seed.ts                # Données de test
│
├── types/
│   └── next-auth.d.ts         # Types TypeScript NextAuth
│
├── middleware.ts              # Middleware de protection
├── next.config.js            # Configuration Next.js
├── tailwind.config.js        # Configuration Tailwind
├── tsconfig.json             # Configuration TypeScript
└── .env                      # Variables d'environnement
```

## Flux de données

### 1. Authentification Discord

```
Utilisateur clique "Se connecter"
    ↓
Page /auth/signin
    ↓
signIn('discord') - NextAuth
    ↓
Redirection vers Discord OAuth
    ↓
Utilisateur autorise l'application
    ↓
Callback: /api/auth/callback/discord
    ↓
NextAuth traite le callback
    ↓
Callback signIn() dans lib/auth.ts
    ↓
Appel verifyStaffRole() - lib/discord.ts
    ↓
API Discord: GET /guilds/{guild_id}/members/{user_id}
    ↓
Si membre → role = 'STAFF'
Sinon → role = 'PLAYER'
    ↓
Mise à jour User en base
    ↓
Création de Session
    ↓
Redirection vers /
```

### 2. Création de tournoi (Staff)

```
Staff accède à /staff/tournaments/create
    ↓
Middleware vérifie session.user.role
    ↓
Si STAFF/ADMIN → OK
Sinon → Redirect /
    ↓
Staff remplit le formulaire
    ↓
Submit → Server Action createTournament()
    ↓
Validation côté serveur
    ↓
prisma.tournament.create()
    ↓
Création StaffActionLog
    ↓
revalidatePath('/staff')
    ↓
redirect('/staff/tournaments/{id}')
```

### 3. Génération de bracket

```
Staff clique "Générer le bracket"
    ↓
Client Component → onClick
    ↓
confirm() - Confirmation utilisateur
    ↓
Server Action generateBracket(tournamentId)
    ↓
Récupération du tournoi + équipes acceptées
    ↓
Algorithme de génération:
  - Calcul nombre de rounds
  - Création matches premier round
  - Création matches rounds suivants (vides)
  - Attribution créneaux horaires
    ↓
prisma.match.createMany()
    ↓
Création StaffActionLog
    ↓
revalidatePath('/staff/tournaments/{id}')
    ↓
Page se recharge avec bracket généré
```

### 4. Validation d'équipe

```
Staff clique "Accepter" ou "Refuser"
    ↓
Client Component → onClick
    ↓
Si refus → Affiche textarea pour motif
    ↓
Server Action validateTeam(tournamentTeamId, status, reason?)
    ↓
Vérification role staff
    ↓
prisma.tournamentTeam.update()
    ↓
Création StaffActionLog
    ↓
revalidatePath('/staff/tournaments/{id}')
    ↓
Équipe passe à ACCEPTED ou REJECTED
```

## Modèle de données

### Relations principales

```
User
  ├── 1:N → Account (NextAuth)
  ├── 1:N → Session (NextAuth)
  ├── 1:N → Team (as owner)
  ├── N:M → Team (via TeamPlayer)
  └── 1:N → StaffActionLog

Team
  ├── N:1 → User (owner)
  ├── N:M → User (via TeamPlayer)
  ├── 1:N → TournamentTeam
  └── 1:N → Match (as teamA or teamB)

Tournament
  ├── 1:N → TournamentTeam
  ├── 1:N → Match
  └── 1:N → StaffActionLog

Match
  ├── N:1 → Tournament
  ├── N:1 → Team (teamA)
  ├── N:1 → Team (teamB)
  ├── 1:1 → PickBan
  └── 1:N → StaffActionLog

PickBan
  ├── 1:1 → Match
  └── 1:N → PickBanAction
```

## Patterns et bonnes pratiques

### Server Components vs Client Components

**Server Components** (par défaut):
- Pages qui fetch des données
- Layout avec données serveur
- Composants statiques
- Avantages: 
  - Pas de JavaScript envoyé au client
  - Accès direct à la base de données
  - SEO optimisé

**Client Components** (`'use client'`):
- Composants avec état (useState, useEffect)
- Event handlers (onClick, onChange)
- Hooks React
- Exemples:
  - Boutons interactifs
  - Formulaires avec validation
  - Modales

### Server Actions

Fonctions serveur appelables depuis le client:

```typescript
'use server'

export async function createTournament(formData: FormData) {
  // Validation
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'STAFF') {
    throw new Error('Non autorisé')
  }
  
  // Business logic
  const tournament = await prisma.tournament.create({...})
  
  // Logging
  await prisma.staffActionLog.create({...})
  
  // Revalidation
  revalidatePath('/staff')
  
  // Redirection
  redirect('/staff/tournaments/' + tournament.id)
}
```

Avantages:
- Code côté serveur sécurisé
- Pas besoin d'API routes
- Type-safe avec TypeScript
- Streaming et suspense support

### Sécurité

#### 1. Protection des routes (middleware.ts)

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (pathname.startsWith('/staff')) {
    if (!token || token.role !== 'STAFF') {
      return NextResponse.redirect(...)
    }
  }
  
  return NextResponse.next()
}
```

#### 2. Vérification côté serveur

Toujours vérifier les permissions dans les Server Actions:

```typescript
'use server'

export async function sensitiveAction() {
  const session = await getServerSession(authOptions)
  
  // Vérification obligatoire
  if (!session || !canPerformAction(session.user)) {
    throw new Error('Non autorisé')
  }
  
  // ...action
}
```

#### 3. Validation des entrées

Utilisez Zod pour valider:

```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3).max(100),
  maxTeams: z.number().min(2).max(128),
})

const validated = schema.parse(data)
```

### Gestion d'état

- **Global**: Context API via providers (AuthProvider)
- **Server**: Database via Prisma
- **Client**: useState, useReducer
- **URL**: searchParams pour filtres
- **Cache**: Next.js automatic caching + revalidatePath()

### Performance

- **RSC**: Rendu côté serveur par défaut
- **Streaming**: Suspense boundaries
- **Prefetching**: Link components
- **Image optimization**: next/image
- **Code splitting**: Automatic par Next.js
- **Database**: 
  - Indexes sur colonnes fréquemment requêtées
  - Pagination pour grandes listes
  - Select only needed fields

## Algorithmes clés

### Génération de bracket (Simple élimination)

```typescript
// Nombre d'équipes: 8
// Rounds nécessaires: log2(8) = 3
// Structure:
//   Round 1: 4 matches (8 équipes)
//   Round 2: 2 matches (4 équipes)
//   Round 3: 1 match   (2 équipes) = Finale

const numTeams = acceptedTeams.length
const numRounds = Math.ceil(Math.log2(numTeams))

// Premier round: matches avec équipes
for (let i = 0; i < numTeams; i += 2) {
  createMatch({
    teamA: teams[i],
    teamB: teams[i + 1],
    round: 'Round 1',
  })
}

// Rounds suivants: matches vides (remplis après victoires)
for (let round = 2; round <= numRounds; round++) {
  const matchesInRound = Math.pow(2, numRounds - round)
  
  for (let i = 0; i < matchesInRound; i++) {
    createMatch({
      teamA: null,  // Sera rempli après match précédent
      teamB: null,
      round: getRoundName(round, numRounds),
    })
  }
}
```

### Vérification rôle staff

```typescript
async function verifyStaffRole(discordId: string): Promise<boolean> {
  // Appel API Discord
  try {
    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
      {
        headers: { Authorization: `Bot ${botToken}` }
      }
    )
    
    // Si 200 → membre du serveur → staff
    return response.status === 200
  } catch (error) {
    // Si 404 → pas membre → pas staff
    if (error.response?.status === 404) return false
    throw error
  }
}
```

## Extensibilité

### Ajouter un nouveau format de tournoi

1. Créer un algorithme dans `lib/brackets/`
2. Modifier `generateBracket()` pour supporter le nouveau format
3. Ajouter l'option dans le formulaire de création

### Ajouter un nouveau jeu

1. Ajouter dans la liste des jeux (select)
2. (Optionnel) Créer des modèles pick & ban spécifiques
3. (Optionnel) Adapter l'affichage selon le jeu

### Ajouter des notifications

1. Créer `lib/notifications/`
2. Implémenter providers (email, Discord webhook)
3. Appeler dans les Server Actions après actions importantes

## Debugging

### Logs Prisma

En développement, les requêtes sont loguées:

```typescript
// lib/prisma.ts
log: process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] 
  : ['error']
```

### Logs Discord

Vérifier les erreurs d'API Discord:

```typescript
// lib/discord.ts
console.error('Erreur Discord API:', error)
```

### Prisma Studio

Interface graphique pour voir la base:

```bash
npm run db:studio
```

---

**Note**: Cette architecture est évolutive et peut être adaptée selon les besoins du projet.
