# Système de Notifications - Documentation

## ✅ Fonctionnalités Implémentées

### 1. **Dropdown de Notifications Moderne** 🎨

Au lieu d'une page séparée, les notifications s'affichent dans un **dropdown élégant** :

#### Déclenchement
- **Clic sur la photo de profil** → Ouvre le dropdown
- **Clic en dehors** → Ferme le dropdown

#### Badge Visuel
- **Pastille rouge** en haut à droite de l'avatar
- Affiche le nombre de notifications non lues (max "9+")
- **Animation pulse** pour attirer l'attention
- Design : cercle rouge avec bordure blanche

#### Contenu du Dropdown
- **Header** : "Notifications" + bouton "Tout marquer comme lu"
- **Liste** : 5 dernières notifications maximum
  - Icônes selon le type (✅❌📝💬📅)
  - Titre en gras
  - Message (2 lignes max avec ellipsis)
  - Date et heure formatées
  - Point bleu pour les non lues
  - Fond bleu clair pour les non lues
- **Footer** : Bouton "Voir mon profil →"

#### Interactions
- Clic sur une notification → Marque comme lue + Redirige vers la page liée + Ferme le dropdown
- Hover sur une notification → Fond gris léger
- Bouton "Tout marquer comme lu" → Marque toutes les notifs comme lues

### 2. **Temps Réel avec SSE** ⚡🔥

Le système utilise **Server-Sent Events (SSE)** pour des notifications **instantanées** :

#### Compteur Badge (Temps Réel)
- **Connexion SSE permanente** via `/api/notifications/stream`
- **Vérification toutes les 2 secondes** côté serveur
- **Push instantané** au client dès qu'une notification arrive
- **Fallback automatique** sur polling si SSE échoue
- Pas besoin de recharger la page !

#### Liste des Notifications (Dropdown ouvert)
- **Refresh toutes les 3 secondes** quand le dropdown est ouvert
- Fetch immédiat à l'ouverture du dropdown
- Les nouvelles notifications apparaissent automatiquement

#### Optimisations
- **Mise à jour immédiate** de l'UI lors d'une action (clic sur notification, "tout marquer comme lu")
- **Double vérification** : refetch après 100ms pour confirmer l'état du serveur
- **Pas de fermeture automatique** du dropdown lors du clic sur une notification
- Navigation différée de 200ms pour laisser le temps à l'animation
- **Reconnexion automatique** si la connexion SSE est perdue

> 🔥 **Vrai temps réel** : SSE push les notifications au client dès qu'elles arrivent !
> 
> 💡 **Prêt pour le chat** : Cette architecture SSE sera réutilisée pour les messages staff-joueur
> 
> ⚠️ **Fallback intelligent** : Si SSE échoue (firewall, proxy), le système bascule automatiquement sur du polling 5s

### 3. **API Routes Créées**

#### `/api/notifications/stream` (GET) 🔥 **NOUVEAU - SSE**
- Connexion SSE permanente pour push en temps réel
- Stream continu de mises à jour du compteur
- Vérifie la base de données toutes les 2s
- Reconnexion automatique en cas de déconnexion
- Utilisé par le badge pour les notifications instantanées

#### `/api/notifications/count` (GET)
- Retourne le nombre de notifications non lues
- Utilisé en fallback si SSE échoue

#### `/api/notifications/list` (GET)
- Retourne toutes les notifications de l'utilisateur
- Triées par date (plus récentes en premier)
- Utilisé quand on ouvre le dropdown

#### `/api/notifications/mark-read` (POST)
- Marque UNE notification comme lue
- Body: `{ notificationId: "..." }`

#### `/api/notifications/mark-all-read` (POST)
- Marque TOUTES les notifications comme lues
- Pas de body nécessaire

#### Types de Notifications
- `TEAM_VALIDATED` ✅ - Équipe acceptée pour un tournoi
- `TEAM_REJECTED` ❌ - Équipe refusée pour un tournoi
- `REGISTRATION_SUBMITTED` 📝 - Inscription soumise, en attente de validation
- `STAFF_MESSAGE` 💬 - Message du staff (prévu pour le système de chat)
- `MATCH_SCHEDULED` 📅 - Match programmé (peut être ajouté ultérieurement)

### 2. Interface Utilisateur

#### Page Notifications (`/notifications`)
- Liste complète des notifications avec icônes selon le type
- Badge "Nouveau" pour les notifications non lues
- Bouton "Marquer comme lu" individuel
- Bouton "Tout marquer comme lu" global
- Affichage de la date et heure
- Liens vers les ressources liées (tournois, équipes)
- État vide avec design friendly

#### Badge de Notifications (Header)
- **Fichier**: `components/layout/notifications-badge.tsx`
- Badge animé avec le nombre de notifications non lues
- Rafraîchissement automatique toutes les 30 secondes
- Animation pulse sur le badge rouge
- Affichage "9+" pour plus de 9 notifications

#### API Route
- **Endpoint**: `/api/notifications/count`
- Retourne le nombre de notifications non lues
- Utilisé par le badge dans le header
- Accessible même si non authentifié (retourne 0)

### 3. Intégrations Automatiques

#### Validation d'Équipe par le Staff
- **Fichier modifié**: `lib/actions/staff.ts`
- Crée automatiquement une notification lors de :
  - ✅ Acceptation d'une équipe
  - ❌ Refus d'une équipe (avec raison)
- Notifie le propriétaire de l'équipe
- Inclut le champ `rejectedBy` pour tracer le modérateur

#### Inscription d'Équipe
- **Fichier modifié**: `lib/actions/teams.ts`
- Crée une notification automatique lors de l'inscription
- Type: `REGISTRATION_SUBMITTED`
- Informe l'utilisateur que son inscription est en attente

### 4. Section Équipes Refusées (Staff Dashboard)

#### Affichage
- **Fichier**: `app/staff/tournaments/[id]/page.tsx`
- Nouvelle section "Équipes refusées" avec badge rouge
- Affiche toutes les équipes refusées pour le tournoi
- Informations affichées :
  - Nom et tag de l'équipe
  - Date d'inscription
  - Raison du refus
  - Nom du modérateur qui a refusé (`rejectedBy`)
  - Liste des joueurs

#### Actions
- Bouton "↺ Réexaminer" pour revalider une équipe refusée
- Permet au staff de corriger une décision

### 5. Modifications du Schéma Prisma

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // TEAM_VALIDATED, TEAM_REJECTED, REGISTRATION_SUBMITTED, STAFF_MESSAGE, MATCH_SCHEDULED
  title     String
  message   String
  read      Boolean  @default(false)
  relatedId String?  // ID du tournoi, équipe, match, etc.
  createdAt DateTime @default(now())
}

model Message {
  id         String   @id @default(cuid())
  senderId   String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id], onDelete: Cascade)
  subject    String
  content    String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model TournamentTeam {
  // ... autres champs
  rejectedBy String? // ID du staff qui a refusé l'équipe
}
```

## 📋 Prochaines Étapes (Non Implémentées)

### 1. Système de Chat Staff-Joueur
- [ ] Interface de messagerie pour les joueurs (`/messages`)
- [ ] Interface de messagerie pour le staff (`/staff/messages`)
- [ ] Bouton "Contacter joueur" sur les profils
- [ ] Notification automatique à la réception d'un message
- [ ] Badge de messages non lus

### 2. Améliorations Potentielles
- [ ] Notifications push (WebSocket ou Server-Sent Events)
- [ ] Paramètres de notifications (désactiver certains types)
- [ ] Historique des actions du staff
- [ ] Statistiques des notifications

## 🧪 Comment Tester

### Créer des notifications de test

```powershell
npm run test:notifications
```

Ce script crée 3 notifications de test :
- ✅ Une notification d'équipe acceptée (non lue)
- 📝 Une notification d'inscription en attente (non lue)
- 📅 Une notification de match programmé (déjà lue)

### Étapes de test

1. **Connecte-toi** sur l'application
2. **Lance le script** : `npm run test:notifications`
3. **Rafraîchis la page** (F5)
4. **Observe** :
   - Pastille rouge "2" sur ta photo de profil
   - Animation pulse sur la pastille
5. **Clique sur ta photo** → Dropdown s'ouvre
6. **Vérifie** :
   - 3 notifications affichées
   - 2 avec fond bleu (non lues) + point bleu
   - 1 avec fond blanc (déjà lue)
   - Icônes différentes selon le type
7. **Clique sur une notification non lue** :
   - Elle devient lue (fond blanc)
   - Pastille passe à "1"
8. **Clique sur "Tout marquer comme lu"** :
   - Toutes les notifications passent en fond blanc
   - Pastille disparaît

### Notifications automatiques (en production)

Les notifications sont créées automatiquement quand :
- ✅ **Staff accepte une équipe** → Notification au propriétaire
- ❌ **Staff refuse une équipe** → Notification au propriétaire (avec raison)
- 📝 **Joueur inscrit son équipe** → Notification de confirmation

## 📱 Design & UX

### Dropdown
- **Largeur** : 384px (w-96)
- **Hauteur max** : 384px (max-h-96) avec scroll
- **Position** : Aligné à droite de l'avatar
- **Z-index** : 50 (au-dessus de tout)
- **Animation** : Apparition instantanée
- **Shadow** : shadow-xl pour effet "pop"

### Pastille Rouge
- **Taille** : 20px × 20px (h-5 w-5)
- **Position** : -4px top, -4px right
- **Couleur** : Rouge (#ef4444)
- **Bordure** : 2px blanche
- **Animation** : pulse (pulsation continue)
- **Max display** : "9+" au-delà de 9 notifications

### Interactions
- **Hover avatar** : Scale 105% + Ring primary-300
- **Hover notification** : Background gray-50
- **Click outside** : Ferme le dropdown
- **Focus ring** : primary-500 sur l'avatar

### Couleurs
- **Non lu** : bg-primary-50 (bleu très clair)
- **Lu** : bg-white
- **Point** : bg-primary-600 (bleu vif)
- **Hover** : bg-gray-50

## 🚀 Prochaines Améliorations

### Court terme
- [x] **Temps réel** via SSE (Server-Sent Events) ✅ **FAIT !**
- [ ] **Son** lors de l'arrivée d'une nouvelle notification
- [ ] **Toast** discret en haut à droite quand nouvelle notification
- [ ] **Badge sur l'onglet** du navigateur (Favicon avec count)
- [ ] **Chat staff-joueur** en temps réel (réutilisation de l'infrastructure SSE)

### Moyen terme
- [ ] **Filtres** dans le dropdown (Toutes / Non lues / Par type)
- [ ] **Recherche** dans les notifications
- [ ] **Pagination** au-delà de 5 notifications
- [ ] **Actions rapides** dans le dropdown (accepter/refuser sans quitter)

### Long terme
- [ ] **Préférences** de notifications (désactiver certains types)
- [ ] **Notifications email** pour événements importants
- [ ] **Historique** complet avec archive
- [ ] **Statistiques** (notifications reçues par mois, etc.)

## 🎯 Architecture Temps Réel

### SSE vs WebSocket

**Pourquoi SSE ?**
- ✅ Plus simple à implémenter
- ✅ Reconnexion automatique
- ✅ Compatible avec les proxies/firewalls
- ✅ Parfait pour les notifications (uni-directionnel : serveur → client)
- ✅ Fallback automatique sur polling

**WebSocket serait mieux pour :**
- Chat bidirectionnel (mais SSE suffit pour notifier de nouveaux messages)
- Gaming en temps réel
- Collaboration en temps réel (éditeur partagé)

**Notre choix :** SSE pour les notifications + polling pour le contenu = architecture scalable et robuste ! 🚀

## 🎨 Design et UX

- Utilisation cohérente des couleurs :
  - ✅ Vert pour les validations
  - ❌ Rouge pour les refus
  - 📝 Bleu pour les inscriptions en attente
  - 💬 Couleur primaire pour les messages
- Animations subtiles (pulse sur le badge)
- États vides avec messages encourageants
- Responsive design sur tous les écrans

## 🔒 Sécurité

- Toutes les actions vérifient l'authentification via `getServerSession`
- Les notifications sont filtrées par `userId`
- Seul le propriétaire peut marquer ses notifications comme lues
- Validation côté serveur pour toutes les opérations

## 📱 Navigation

Nouvelle structure de navigation pour les utilisateurs connectés :
- Accueil → Tournois → Équipes → Joueurs → **Mes équipes** → Invitations → **🔔 Notifications** → Profil
