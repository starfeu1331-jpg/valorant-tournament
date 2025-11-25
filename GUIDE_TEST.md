# 🧪 Guide de test - Nouvelles fonctionnalités

## ⚠️ Prérequis
- Avoir au moins **2 comptes Discord** de test
- Les deux comptes connectés au site via Discord OAuth
- Serveur Next.js lancé (`npm run dev`)

---

## 1️⃣ Test : Système d'invitations

### Étape 1 : Créer une équipe (Compte A)
1. Connectez-vous avec le **Compte A**
2. Allez sur `/teams`
3. Cliquez sur "Créer une équipe"
4. Remplissez les infos et créez l'équipe

### Étape 2 : Inviter un joueur (Compte A)
1. Sur la page de votre équipe, trouvez la section **"Inviter un joueur"**
2. Entrez le **nom d'utilisateur Discord** du Compte B (ex: `joueur2`)
3. Cliquez sur **"Inviter"**
4. ✅ Vérifiez : Message de succès "Invitation envoyée"

### Étape 3 : Voir l'invitation (Compte B)
1. Connectez-vous avec le **Compte B**
2. Regardez le **header** : badge rouge avec "1" sur "Invitations"
3. Cliquez sur **"Invitations"** dans le header
4. ✅ Vérifiez : Vous voyez l'invitation de l'équipe du Compte A

### Étape 4 : Accepter l'invitation (Compte B)
1. Sur `/invitations`, cliquez sur **"Accepter"**
2. ✅ Vérifiez : Message de succès
3. Allez sur `/teams` : vous devriez voir l'équipe dans "Mes équipes"
4. ✅ Vérifiez : Le badge "Invitations" dans le header a disparu

### Étape 5 : Vérifier le roster (Compte A)
1. Retournez sur le **Compte A**
2. Allez sur la page de votre équipe
3. ✅ Vérifiez : Le Compte B apparaît dans le roster avec badge "ACTIVE"

---

## 2️⃣ Test : Riot ID et Valorant API

### Étape 1 : Configurer son Riot ID
1. Connectez-vous avec un compte
2. Cliquez sur votre **avatar** dans le header
3. Vous êtes redirigé vers `/profile`
4. Dans la section "Riot ID", entrez votre ID au format **`Name#TAG`**
   - Exemple : `PlayerOne#EU1`
   - ⚠️ Le # et le TAG sont obligatoires !
5. Cliquez sur **"Vérifier et enregistrer"**
6. ✅ Vérifiez : Riot ID enregistré affiché

### Étape 2 : Récupérer le rang Valorant
1. Cliquez sur **"🔄 Actualiser le rang"**
2. ⚠️ **Attendu** : 
   - Soit ✅ succès avec affichage du rang (ex: "Gold 3")
   - Soit ❌ erreur "Impossible de récupérer les données"

### Si erreur API :
L'erreur est **normale** si :
- Vous n'avez pas de clé API Henrik configurée dans `.env`
- Le Riot ID n'existe pas dans l'API
- L'API est temporairement indisponible

**Pour activer l'API :**
1. Créez un compte sur https://docs.henrikdev.xyz/
2. Obtenez votre clé API gratuite
3. Ajoutez dans `.env` : `HENRIK_API_KEY=votre-cle`
4. Redémarrez le serveur

### Étape 3 : Vérifier l'affichage du rang
1. Allez sur `/joueurs` (liste publique)
2. ✅ Vérifiez : Les joueurs avec Riot ID configuré ont un badge violet avec le rang
3. Cliquez sur un profil joueur
4. ✅ Vérifiez : Le rang s'affiche dans la section "Informations"

---

## 3️⃣ Test : Navigation entre profils

### Étape 1 : Profil → Équipes
1. Allez sur `/joueurs/[id]` (un profil joueur public)
2. Dans la section **"Équipes"**, cliquez sur le nom d'une équipe
3. ✅ Vérifiez : Redirection vers `/equipes/[id]`

### Étape 2 : Équipe → Joueurs
1. Allez sur `/equipes/[id]` (une équipe publique)
2. Dans le **roster**, cliquez sur le nom d'un joueur
3. ✅ Vérifiez : Redirection vers `/joueurs/[id]`

### Étape 3 : Header → Profil personnel
1. Cliquez sur votre **avatar** dans le header
2. ✅ Vérifiez : Redirection vers `/profile`

---

## 4️⃣ Test : Gestion Staff

### Prérequis : Avoir un compte STAFF ou ADMIN
Pour promouvoir un compte en STAFF :
```powershell
npx prisma studio
```
1. Allez dans la table **User**
2. Trouvez votre compte
3. Changez `role` de `PLAYER` à `STAFF`

### Étape 1 : Accéder à la gestion joueur
1. Connectez-vous avec le compte **STAFF**
2. Allez sur `/joueurs/[id]` (n'importe quel joueur)
3. ✅ Vérifiez : Bouton **"⚙️ Gérer ce joueur"** visible en haut
4. Cliquez sur le bouton
5. ✅ Vérifiez : Redirection vers `/staff/joueurs/[id]`

### Étape 2 : Changer le rôle d'un joueur
1. Dans la section **"Actions Staff"**, trouvez le formulaire "Changer le rôle"
2. Sélectionnez un nouveau rôle (ex: STAFF)
3. Cliquez sur **"Changer le rôle"**
4. ✅ Vérifiez : Message de succès
5. Allez sur Prisma Studio pour vérifier le changement

### Étape 3 : Accéder à la gestion équipe
1. Allez sur `/staff/equipes/[id]` (n'importe quelle équipe)
2. ✅ Vérifiez : Vous voyez les informations détaillées
3. ✅ Vérifiez : Boutons "Retirer" à côté de chaque joueur
4. ✅ Vérifiez : Bouton rouge "Supprimer l'équipe" en bas

---

## 5️⃣ Test : Recherche publique

### Étape 1 : Rechercher une équipe
1. Allez sur `/equipes`
2. Dans la barre de recherche, tapez un **nom d'équipe** ou **tag**
3. ✅ Vérifiez : Liste filtrée en temps réel

### Étape 2 : Rechercher un joueur
1. Allez sur `/joueurs`
2. Dans la barre de recherche, tapez un **nom d'utilisateur**
3. ✅ Vérifiez : Liste filtrée en temps réel
4. ✅ Vérifiez : Les rangs Valorant s'affichent en badges

---

## ✅ Checklist finale

- [ ] Invitation envoyée et reçue
- [ ] Invitation acceptée, joueur ajouté au roster
- [ ] Riot ID configuré sur le profil
- [ ] Tentative de récupération du rang Valorant (avec ou sans succès)
- [ ] Navigation profil → équipe fonctionne
- [ ] Navigation équipe → profil fonctionne
- [ ] Avatar header → profil personnel fonctionne
- [ ] Page staff joueur accessible (avec compte STAFF)
- [ ] Changement de rôle fonctionne
- [ ] Recherche équipes fonctionne
- [ ] Recherche joueurs fonctionne

---

## 🐛 Problèmes connus

### 1. API Valorant échoue
**Symptôme** : Erreur "Impossible de récupérer les données"
**Cause** : Pas de clé API Henrik configurée
**Solution** : Ajouter `HENRIK_API_KEY` dans `.env` (voir docs Henrik)

### 2. Invitation ne s'affiche pas
**Symptôme** : Badge vide sur "Invitations"
**Cause** : Le joueur invité n'a pas de compte sur le site
**Solution** : Le joueur doit se connecter au moins une fois via Discord OAuth

### 3. Bouton "Gérer" pas visible
**Symptôme** : Pas de bouton staff sur les profils
**Cause** : Votre compte n'est pas STAFF/ADMIN
**Solution** : Changer le rôle dans Prisma Studio

---

## 📸 Captures d'écran attendues

### Page profil (`/profile`)
- Formulaire Riot ID
- Bouton "Actualiser le rang"
- Badge avec rang actuel (si configuré)

### Page invitations (`/invitations`)
- Liste des invitations avec nom d'équipe
- Boutons "Accepter" / "Refuser"
- Badge dans le header

### Page roster équipe
- Liste des joueurs avec badges ACTIVE
- Liens cliquables vers profils joueurs
- Section "Inviter un joueur" (owner uniquement)

### Page staff joueur
- Infos complètes (Discord ID, Riot ID, email)
- Formulaire changement de rôle
- Liste des équipes et inscriptions

---

## 🚨 Si quelque chose ne fonctionne pas

1. **Vérifiez les logs du terminal** : Erreurs TypeScript, Prisma, API
2. **Ouvrez la console navigateur** (F12) : Erreurs JavaScript
3. **Vérifiez Prisma Studio** : Les données sont-elles bien enregistrées ?
4. **Redémarrez le serveur** : `Ctrl+C` puis `npm run dev`
5. **Régénérez Prisma** : `npx prisma generate` puis redémarrez

---

**Temps de test estimé : 15-20 minutes**
