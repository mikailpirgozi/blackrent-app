# 🚀 Blackrent - Rýchly Deployment

## 📋 Pred začatím

**Potrebujete:**
- Server s Ubuntu/Debian
- Vlastnú doménu (napr. `blackrent.sk`)
- Základné znalosti terminál

## ⚡ 5-minútový setup

### 1. Príprava servera
```bash
# SSH na server
ssh root@your-server-ip

# Inštalácia Docker
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Upload aplikácie
```bash
# Nahrajte súbory na server (cez scp/sftp/git)
scp -r blackrent-new/ root@your-server:/root/blackrent/
ssh root@your-server
cd /root/blackrent
```

### 3. Konfigurácia
```bash
# Kopírovanie environment súboru
cp production.env .env

# Úprava nastavení (nano/vim)
nano .env
```

**Upravte tieto riadky:**
```bash
FRONTEND_URL=https://vasa-domena.sk
DOMAIN=vasa-domena.sk
DB_PASSWORD=silne-heslo-123!
SSL_EMAIL=admin@vasa-domena.sk
```

### 4. Nasadenie
```bash
# Jednoduché nasadenie
chmod +x deploy.sh
./deploy.sh
```

### 5. SSL Certifikáty
```bash
# Let's Encrypt certifikáty
apt install certbot -y
certbot certonly --standalone -d vasa-domena.sk
cp /etc/letsencrypt/live/vasa-domena.sk/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/vasa-domena.sk/privkey.pem nginx/ssl/
./deploy.sh restart
```

## ✅ Kontrola

**Otvorte v prehliadači:**
- `https://vasa-domena.sk` - aplikácia
- `https://vasa-domena.sk/health` - health check

**Admin prístup:**
- Username: `admin`
- Password: `admin123`

## 🔧 Užitočné príkazy

```bash
./deploy.sh status    # Stav služieb
./deploy.sh logs      # Zobrazenie logov
./deploy.sh restart   # Reštart aplikácie
./deploy.sh backup    # Záloha databázy
```

## 🆘 Pomoc

**Ak nefunguje:**
1. Skontrolujte logy: `./deploy.sh logs`
2. Overte DNS: `nslookup vasa-domena.sk`
3. Testujte bez SSL: `http://vasa-domena.sk:5001`

**Potrebujete pomoc?** Pozrite [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

---
**🎉 Hotovo! Aplikácia beží na `https://vasa-domena.sk`** 