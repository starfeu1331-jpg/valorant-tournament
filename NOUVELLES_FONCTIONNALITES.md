# ✅ Nouvelles fonctionnalités implémentées

## 🎮 Système d'invitations d'équipe

### Comment ça marche :
1. **Inviter un joueur** : Sur la page de votre équipe (`/teams/[id]`), remplissez le nom d'utilisateur Discord du joueur et cliquez sur "Inviter"
2. **Voir ses invitations** : Cliquez sur "Invitations" dans le header pour voir toutes vos invitations en attente
3. **Accepter/Refuser** : Sur `/invitations`, vous pouvez accepter ou refuser chaque invitation
4. **Rejoindre l'équipe** : Une fois acceptée, vous êtes automatiquement ajouté au roster

### Permissions :
- Seul le **propriétaire** de l'équipe peut inviter des joueurs
- Les joueurs invités doivent être **inscrits sur le site** (avoir un compte Discord connecté)
- Une invitation ne peut être envoyée qu'une seule fois par équipe/joueur

## 🎯 Intégration Valorant API

### Configuration du Riot ID :
1. Allez sur **votre profil** en cliquant sur votre avatar dans le header
2. Entrez votre **Riot ID** au format `NomDeCompte#TAG` (ex: `PlayerOne#EU1`)
3. Cliquez sur "Vérifier et enregistrer"
4. Le système récupère automatiquement votre **rang Valorant** actuel

### API Henrik (Valorant) :
L'application utilise l'API gratuite de Henrik pour récupérer les rangs Valorant.

**⚠️ Configuration requise :**
Ajoutez votre clé API dans `.env` (optionnel, fonctionne sans clé avec limitations) :
```
HENRIK_API_KEY=votre-cle-api-ici
```

Pour obtenir une clé gratuite : https://docs.henrikdev.xyz/

### Affichage du rang :
- Sur votre profil : Affichage complet avec date de mise à jour
- Sur les profils joueurs publics : Badge avec le rang
- Dans le roster des équipes : Badge violet avec le rang à côté du nom

### Actualiser le rang :
- Bouton "🔄 Actualiser le rang" sur votre profil
- Cache de 1h sur les requêtes API

## 🔗 Liens entre profils

### Navigation améliorée :
- **Dans les équipes** (`/equipes/[id]`) : Cliquez sur un nom de joueur pour voir son profil → `/joueurs/[id]`
- **Dans les profils joueurs** (`/joueurs/[id]`) : Cliquez sur un nom d'équipe pour voir l'équipe → `/equipes/[id]`
- **Header** : Cliquez sur votre avatar pour accéder à votre profil

### Pages ajoutées :
- `/profile` - Votre profil personnel avec configuration Riot ID
- `/invitations` - Vos invitations d'équipes en attente
- `/equipes` - Liste publique de toutes les équipes (avec recherche)
- `/equipes/[id]` - Détail public d'une équipe
- `/joueurs` - Liste publique de tous les joueurs (avec recherche)
- `/joueurs/[id]` - Profil public d'un joueur

## ⚙️ Gestion Staff

### Page de gestion joueur (`/staff/joueurs/[id]`) :

**Informations visibles :**
- Discord ID
- Email
- Riot ID et rang Valorant
- Date d'inscription
- Statistiques (équipes créées/rejointes)

**Actions disponibles :**
1. **Changer le rôle** : PLAYER → STAFF → ADMIN
2. **Supprimer le compte** : Suppression définitive avec log staff

**Accès :**
- Bouton "⚙️ Gérer" visible sur les profils publics (STAFF/ADMIN uniquement)
- Accessible via `/staff/joueurs/[id]`

### Page de gestion équipe (`/staff/equipes/[id]`) :

**Actions disponibles :**
1. **Retirer des joueurs** du roster
2. **Voir les informations complètes** (propriétaire, Discord ID, email, dates)
3. **Supprimer l'équipe** définitivement

## 📊 Base de données

### Nouveaux champs User :
- `riotId` : Riot ID au format Name#TAG
- `valorantRank` : Rang actuel (ex: "Gold 3", "Platinum 1")
- `valorantRankUpdated` : Date de dernière mise à jour du rang

### Nouveau modèle TeamInvitation :
```prisma
model TeamInvitation {
  id            String   @id @default(cuid())
  teamId        String
  invitedById   String
  invitedUserId String
  status        String   @default("PENDING") // PENDING, ACCEPTED, DECLINED
  createdAt     DateTime @default(now())
  respondedAt   DateTime?
}
```

## 🧪 Tests effectués

✅ Migration Prisma appliquée
✅ Client Prisma régénéré
✅ Serveur Next.js redémarré
✅ Pages de profil fonctionnelles
✅ Navigation entre profils/équipes
✅ Système d'invitations opérationnel
✅ Gestion staff complète

## 📝 Notes importantes

1. **API Valorant** : Requiert une vraie clé API pour fonctionner. Sans clé, les requêtes échoueront mais le site reste fonctionnel.

2. **Invitations** : Les joueurs doivent avoir un compte sur le site pour pouvoir être invités (recherche par nom d'utilisateur Discord).

3. **Liens** : Tous les noms de joueurs et d'équipes sont maintenant cliquables pour naviguer entre les profils.

4. **Staff** : Les boutons de gestion n'apparaissent que pour les utilisateurs avec le rôle STAFF ou ADMIN.

## 🚀 Prochaines étapes suggérées

- [ ] Obtenir une clé API Henrik pour activer la récupération des rangs Valorant
- [ ] Ajouter notifications Discord pour les invitations
- [ ] Ajouter système de messagerie interne
- [ ] Implémenter le pick & ban pour les matchs
- [ ] Ajouter statistiques de joueurs avancées
