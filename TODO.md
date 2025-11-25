# 🚧 Fonctionnalités à implémenter

Ce document liste les fonctionnalités manquantes principales à développer pour compléter l'application.

## 1. Gestion des équipes côté joueur

### Pages à créer

#### `/teams/create` - Créer une équipe
- Formulaire avec:
  - Nom de l'équipe (requis)
  - Tag (ex: "TSM", "G2") (requis, unique)
  - Jeu principal (select)
  - Logo (upload image)
  - Description
- Validation: nom unique, tag unique
- Après création → rediriger vers `/teams/[id]`

#### `/teams/[id]` - Page d'une équipe
- Informations de l'équipe
- Liste des joueurs avec leurs rôles
- Bouton "Quitter l'équipe" (si membre)
- Bouton "Modifier" (si propriétaire)
- Liste des tournois de l'équipe
- Statistiques (matches joués, victoires, défaites)

#### `/teams/[id]/edit` - Modifier une équipe (propriétaire seulement)
- Même formulaire que création
- Ajouter/retirer des joueurs
- Changer le propriétaire

#### `/dashboard` - Dashboard joueur
- Mes équipes
- Mes tournois en cours
- Prochains matches
- Notifications

### Actions server à créer

```typescript
// lib/actions/teams.ts

export async function createTeam(formData: FormData)
export async function updateTeam(teamId: string, formData: FormData)
export async function addPlayerToTeam(teamId: string, userId: string, role?: string)
export async function removePlayerFromTeam(teamId: string, userId: string)
export async function deleteTeam(teamId: string)
```

### Composants à créer

- `TeamCard` - Carte d'équipe pour les listes
- `TeamHeader` - En-tête de page équipe
- `PlayerList` - Liste des joueurs d'une équipe
- `TeamForm` - Formulaire création/édition

## 2. Inscription aux tournois

### Page à créer

#### `/tournaments/[id]/register` - S'inscrire à un tournoi
- Sélectionner une équipe parmi ses équipes
- Accepter le règlement (checkbox)
- Confirmer l'inscription
- Messages:
  - Succès: "Votre équipe est en attente de validation par le staff"
  - Erreur: "Votre équipe est déjà inscrite" / "Inscriptions fermées" / "Tournoi complet"

### Actions server à créer

```typescript
// lib/actions/tournaments.ts (ajouter)

export async function registerTeamToTournament(tournamentId: string, teamId: string)
export async function unregisterTeamFromTournament(tournamentId: string, teamId: string)
```

### Validations
- L'utilisateur doit être propriétaire ou membre de l'équipe
- Les inscriptions doivent être ouvertes
- Le tournoi ne doit pas être plein
- L'équipe ne doit pas être déjà inscrite
- L'équipe doit correspondre au jeu du tournoi

## 3. Système Pick & Ban complet

Le système pick & ban est le plus complexe à implémenter.

### Schéma conceptuel

Un tournoi a:
- `pickBanEnabled: boolean`
- `pickBanModel: string` (JSON) - Modèle de séquence
- `availableElements: string` (JSON) - Liste des éléments (maps, personnages, etc.)

Un match a:
- `PickBan` (relation one-to-one)

Un PickBan a:
- `sequence: string` (JSON) - Séquence des étapes
- `completed: boolean`
- `result: string` (JSON) - Résultat final
- `PickBanAction[]` - Historique des actions

### Exemple de modèle pour Valorant BO3

```json
{
  "steps": [
    { "team": "A", "action": "BAN", "description": "Équipe A ban une map" },
    { "team": "B", "action": "BAN", "description": "Équipe B ban une map" },
    { "team": "A", "action": "PICK", "description": "Équipe A pick Map 1" },
    { "team": "B", "action": "PICK", "description": "Équipe B pick Map 2" },
    { "team": "A", "action": "BAN", "description": "Équipe A ban une map" },
    { "team": "B", "action": "BAN", "description": "Équipe B ban une map" },
    { "team": "AUTO", "action": "PICK", "description": "Map restante = Map 3" }
  ]
}
```

### Exemple d'éléments disponibles pour Valorant

```json
["Ascent", "Bind", "Breeze", "Fracture", "Haven", "Icebox", "Lotus", "Pearl", "Split"]
```

### Pages à créer

#### `/staff/tournaments/[id]/pickban/setup` - Configuration pick & ban (staff)
- Activer/désactiver le pick & ban
- Définir les éléments disponibles (liste de maps, personnages, etc.)
- Créer un modèle de séquence:
  - Nombre d'étapes
  - Pour chaque étape: Équipe (A/B/AUTO), Action (PICK/BAN), Description
- Prévisualisation du modèle
- Sauvegarder

#### `/pickban/[matchId]` - Interface pick & ban (joueurs)
- Affichage de la séquence
- État actuel: à qui le tour, quelle action
- Liste des éléments disponibles (boutons cliquables)
- Éléments déjà pick/ban (grisés)
- Historique des actions
- Résultat final (si terminé)
- Protection: seul le capitaine de l'équipe active peut agir
- Temps limite par action (optionnel)

#### `/staff/pickban/[matchId]` - Gérer pick & ban (staff)
- Même interface que joueurs
- Mais le staff peut faire toutes les actions
- Bouton "Réinitialiser le pick & ban"
- Bouton "Forcer la complétion"

### Actions server à créer

```typescript
// lib/actions/pickban.ts

export async function setupPickBanModel(
  tournamentId: string,
  model: PickBanModel,
  availableElements: string[]
)

export async function initializePickBan(matchId: string)

export async function performPickBanAction(
  pickBanId: string,
  action: 'PICK' | 'BAN',
  element: string,
  teamId: string,
  userId: string
)

export async function resetPickBan(pickBanId: string)
```

### Composants à créer

- `PickBanSetup` - Configuration du modèle (staff)
- `PickBanBoard` - Interface principale pick & ban
- `PickBanStep` - Étape de la séquence
- `PickBanElement` - Élément sélectionnable (map, personnage)
- `PickBanHistory` - Historique des actions
- `PickBanResult` - Résultat final

### Logique à implémenter

1. **Initialisation**:
   - Quand un match est créé et que le tournoi a le pick & ban activé
   - Créer un `PickBan` avec la séquence du modèle

2. **Progression**:
   - À chaque action valide, créer un `PickBanAction`
   - Incrémenter l'étape
   - Si toutes les étapes sont faites, marquer `completed = true`
   - Calculer le résultat final (maps dans l'ordre)

3. **Validation**:
   - Vérifier que c'est le tour de l'équipe
   - Vérifier que l'élément n'est pas déjà pick/ban
   - Vérifier que l'utilisateur est membre de l'équipe

4. **Auto-pick**:
   - Si action = "AUTO" et type = "PICK"
   - Prendre automatiquement l'élément restant

5. **Temps réel** (optionnel):
   - Utiliser WebSockets ou Server-Sent Events
   - Notifier les deux équipes en temps réel

## 4. Autres améliorations prioritaires

### Gestion des matches par le staff

#### `/staff/matches/[matchId]` - Gérer un match
- Informations du match
- Modifier la date/heure
- Entrer les scores par map (si BO3/BO5)
- Déclarer un forfait
- Uploader des preuves (screenshots)
- Valider le résultat
- Avancer le vainqueur au prochain round

### Actions server

```typescript
// lib/actions/staff.ts (ajouter)

export async function updateMatchSchedule(matchId: string, scheduledAt: Date)
export async function declareMatchForfeit(matchId: string, forfeitTeamId: string)
export async function uploadMatchProof(matchId: string, file: File)
export async function advanceWinnerToNextRound(matchId: string)
```

### Notifications

- Email quand une équipe est acceptée/refusée
- Discord webhook quand un match approche
- Notification in-app pour les prochains matches

### Upload d'images

- Logo d'équipe
- Preuves de match (screenshots de scores)
- Avatar utilisateur
- Utiliser un service comme:
  - Cloudinary
  - AWS S3
  - Vercel Blob Storage

## 5. Tests à écrire

### Tests unitaires
- Actions server (createTournament, validateTeam, etc.)
- Fonctions utilitaires (formatDate, etc.)
- Validation des données

### Tests d'intégration
- Flux d'inscription joueur
- Flux de création de tournoi
- Génération de bracket
- Pick & ban complet

### Tests E2E
- Parcours utilisateur complet
- Utiliser Playwright ou Cypress

## 6. Déploiement

### Configuration
- Vercel (recommandé pour Next.js)
- PostgreSQL (Supabase, Neon, ou autre)
- Variables d'environnement en production

### Checklist
- [ ] Passer de SQLite à PostgreSQL
- [ ] Configurer les CORS
- [ ] Activer HTTPS
- [ ] Mettre à jour NEXTAUTH_URL
- [ ] Mettre à jour Discord redirect URL
- [ ] Configurer les logs (Sentry, LogRocket)
- [ ] Monitoring (Uptime Robot)

## Ordre d'implémentation recommandé

1. **Gestion des équipes joueur** (essentiel)
2. **Inscription aux tournois** (essentiel)
3. **Amélioration gestion des matches** (important)
4. **Système pick & ban** (complexe, optionnel pour MVP)
5. **Notifications** (nice to have)
6. **Upload d'images** (nice to have)
7. **Tests** (continu)

---

**Note**: Ce document est un guide. Les détails d'implémentation peuvent être ajustés selon les besoins.
