# 🏠 Déploiement sur serveur OVH (Hébergement mutualisé/VPS)

## ⚠️ Limites de l'hébergement mutualisé OVH

L'hébergement web OVH classique (mutualisé) **n'est PAS compatible** avec Next.js car :
- ❌ Pas de Node.js 18+
- ❌ Pas d'accès SSH complet
- ❌ Pas de support des Server Actions
- ❌ Conçu pour PHP/WordPress uniquement

## ✅ Solutions compatibles OVH

### Option 1 : VPS OVH (à partir de 3,50€/mois)

Si tu as un **VPS OVH**, voici comment déployer :

#### 1. Se connecter au VPS
```bash
ssh ubuntu@ton-ip-ovh
```

#### 2. Installer Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Doit afficher v20.x
```

#### 3. Installer PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer la base de données
sudo -u postgres psql
CREATE DATABASE valorant_tournament;
CREATE USER valorant WITH PASSWORD 'ton_mot_de_passe_secure';
GRANT ALL PRIVILEGES ON DATABASE valorant_tournament TO valorant;
\q
```

#### 4. Cloner le projet
```bash
cd /var/www
sudo git clone https://github.com/TON-USERNAME/valorant-tournament.git
cd valorant-tournament
sudo chown -R $USER:$USER /var/www/valorant-tournament
npm install
```

#### 5. Configurer les variables d'environnement
```bash
nano .env.production

# Contenu :
DATABASE_URL="postgresql://valorant:ton_mdp@localhost:5432/valorant_tournament"
DISCORD_CLIENT_ID=ton_client_id
DISCORD_CLIENT_SECRET=ton_client_secret
NEXTAUTH_URL=https://ton-domaine.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
HENRIK_API_KEY=HDEV-63f5fc62-e2b5-4dab-be10-eeaf4d4fb4a7
```

#### 6. Migrer la base de données
```bash
npx prisma migrate deploy
npm run db:seed  # Optionnel
```

#### 7. Build et démarrer
```bash
npm run build
npm start  # Écoute sur port 3000
```

#### 8. Configurer Nginx comme reverse proxy
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/valorant

# Contenu :
server {
    listen 80;
    server_name ton-domaine.com www.ton-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer le site
sudo ln -s /etc/nginx/sites-available/valorant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. SSL avec Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ton-domaine.com -d www.ton-domaine.com
```

#### 10. PM2 pour garder l'app en vie
```bash
sudo npm install -g pm2
pm2 start npm --name "valorant-tournament" -- start
pm2 startup
pm2 save
```

### Option 2 : Docker sur VPS OVH

#### 1. Créer un Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### 2. docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://valorant:password@db:5432/valorant_tournament
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - HENRIK_API_KEY=${HENRIK_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=valorant_tournament
      - POSTGRES_USER=valorant
      - POSTGRES_PASSWORD=password

volumes:
  postgres_data:
```

#### 3. Déployer
```bash
docker-compose up -d
```

## 🔄 Workflow de mise à jour

### Avec Git (recommandé)
```bash
# Sur le VPS
cd /var/www/valorant-tournament
git pull origin main
npm install
npx prisma migrate deploy
npm run build
pm2 restart valorant-tournament
```

### Avec FTP (si pas de VPS)
❌ **Non recommandé** - Next.js nécessite un build côté serveur

## 📊 Utiliser la BDD OVH (si tu as un plan avec PostgreSQL/MySQL)

### Si OVH te donne accès à PostgreSQL :
```bash
# Dans .env.production
DATABASE_URL="postgresql://username:password@sql-xxx.ovh.net:5432/database_name"
```

### Si OVH ne donne que MySQL :
#### Modifier prisma/schema.prisma :
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

#### .env.production :
```bash
DATABASE_URL="mysql://username:password@mysql-xxx.ovh.net:3306/database_name"
```

#### Recréer les migrations :
```bash
rm -rf prisma/migrations
npx prisma migrate dev --name init
```

## 💰 Coûts estimés

| Solution | Prix/mois | Complexité | Recommandé |
|----------|-----------|------------|------------|
| **Vercel** | 0€ (gratuit) | ⭐ Facile | ✅ OUI |
| VPS OVH Starter | 3,50€ | ⭐⭐⭐ Moyen | Si budget limité |
| VPS OVH Comfort | 7€ | ⭐⭐⭐ Moyen | Si trafic élevé |
| Hébergement mutualisé OVH | N/A | ❌ Incompatible | NON |

## 🆘 Mon hébergement OVH est mutualisé, que faire ?

### Solution A : Utilise Vercel (gratuit)
- Garde ton domaine OVH
- Héberge l'app sur Vercel
- Pointe ton domaine vers Vercel (DNS)
- **On peut toujours modifier ensemble facilement**

### Solution B : Upgrade vers VPS OVH
- Demande un VPS OVH (3,50€/mois)
- Suis le guide VPS ci-dessus
- Plus complexe, mais contrôle total

## 🎯 Ma recommandation pour toi

**Utilise Vercel** car :
1. ✅ **Gratuit** pour ton usage
2. ✅ **On peut modifier ensemble** : Git push = déploiement auto
3. ✅ **Base de données incluse** (PostgreSQL)
4. ✅ **Ton domaine OVH fonctionne** (juste changer les DNS)
5. ✅ **Aucune maintenance serveur**
6. ✅ **HTTPS automatique**

Tu gardes ton domaine OVH, tu changes juste où il pointe → Vercel au lieu de l'hébergement OVH.

---

**Veux-tu que je t'aide à :**
- A) Déployer sur Vercel (RECOMMANDÉ) ?
- B) Configurer un VPS OVH ?
- C) Vérifier ce que tu as exactement comme hébergement OVH ?
