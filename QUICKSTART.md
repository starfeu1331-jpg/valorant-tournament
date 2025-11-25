# 🚀 Guide de démarrage rapide

## Étape 1: Configuration Discord (15 minutes)

### A. Créer l'application Discord OAuth

1. Allez sur https://discord.com/developers/applications
2. Cliquez sur **"New Application"**
3. Donnez un nom (ex: "Tournois E-Sport")
4. Dans **OAuth2** → **General**:
   - Copiez le `Client ID`
   - Cliquez sur "Reset Secret" et copiez le `Client Secret`
   - Dans **Redirects**, ajoutez: `http://localhost:3000/api/auth/callback/discord`

### B. Créer le bot Discord

1. Dans la même application, allez dans **Bot**
2. Cliquez sur **"Add Bot"**
3. Copiez le **Token** (ATTENTION: ne le partagez jamais!)
4. Dans **Privileged Gateway Intents**, activez:
   - ✅ Server Members Intent
   - ✅ Message Content Intent (optionnel)
5. Allez dans **OAuth2** → **URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Read Messages/View Channels`
   - Copiez l'URL et invitez le bot sur votre serveur Discord staff

### C. Récupérer l'ID de votre serveur Discord

1. Dans Discord, activez le mode développeur:
   - Paramètres → Avancés → Mode développeur
2. Clic droit sur votre serveur → **Copier l'identifiant du serveur**

### D. Récupérer votre ID Discord personnel

1. Dans Discord, clic droit sur votre avatar/nom
2. **Copier l'identifiant de l'utilisateur**

## Étape 2: Configuration du projet (5 minutes)

### Modifier le fichier `.env`

Ouvrez le fichier `.env` et remplacez les valeurs:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERER_AVEC_COMMANDE_CI_DESSOUS"

# Discord OAuth
DISCORD_CLIENT_ID="coller-ici-le-client-id"
DISCORD_CLIENT_SECRET="coller-ici-le-client-secret"

# Discord Bot & Staff Verification
DISCORD_BOT_TOKEN="coller-ici-le-bot-token"
DISCORD_STAFF_GUILD_ID="coller-ici-l-id-du-serveur"
```

### Générer NEXTAUTH_SECRET

**Windows PowerShell:**
```powershell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

Copiez le résultat dans `.env` pour `NEXTAUTH_SECRET`.

## Étape 3: Créer votre compte admin (2 minutes)

1. Ouvrez `scripts/create-admin.ts`
2. Remplacez `YOUR_DISCORD_ID_HERE` par votre ID Discord (copié à l'étape 1.D)
3. Exécutez:

```bash
npm run create:admin
```

## Étape 4: (Optionnel) Créer des données de test

```bash
npm run db:seed
```

Cela créera:
- 1 tournoi de test
- 4 équipes inscrites

## Étape 5: Lancer l'application

```bash
npm run dev
```

Ouvrez http://localhost:3000

## Étape 6: Tester l'authentification

1. Cliquez sur **"Se connecter avec Discord"**
2. Autorisez l'application
3. Vous êtes redirigé vers la page d'accueil, connecté!

## Étape 7: Accéder au dashboard staff

1. Assurez-vous d'être membre du serveur Discord staff (celui dont vous avez mis l'ID dans `.env`)
2. Allez sur http://localhost:3000/staff
3. Vous devriez voir le dashboard avec le bouton "Créer un tournoi"

## 🎉 C'est tout!

Vous pouvez maintenant:
- Créer des tournois
- Valider des équipes
- Générer des brackets
- Gérer des matches

## 🔧 Commandes utiles

```bash
# Lancer en développement
npm run dev

# Voir la base de données (interface graphique)
npm run db:studio

# Créer des données de test
npm run db:seed

# Réinitialiser la base de données
npx prisma migrate reset

# Build pour production
npm run build
npm start
```

## ⚠️ Problèmes courants

### "Non autorisé" sur /staff

- Vérifiez que vous êtes membre du serveur Discord staff
- Vérifiez que le bot est bien sur le serveur
- Vérifiez que `DISCORD_STAFF_GUILD_ID` est correct
- Déconnectez-vous et reconnectez-vous

### Erreur "Cannot find module"

```bash
npm install
npx prisma generate
```

### La base de données ne se crée pas

```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

## 📚 Documentation complète

Consultez le fichier `README.md` pour la documentation complète.

## 🆘 Besoin d'aide?

1. Vérifiez les logs dans la console
2. Consultez la documentation Discord: https://discord.com/developers/docs
3. Ouvrez une issue sur GitHub
