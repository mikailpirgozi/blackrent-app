# 🚀 Blackrent - Kompletný Deployment Návod

## Prehľad

Tento návod vás prevedie procesom nasadenia Blackrent aplikácie na produkčný server s vlastnou doménou.

## 📋 Požiadavky

### Server
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimálne 2GB, odporúčané 4GB+
- **Storage**: Minimálne 20GB voľného miesta
- **CPU**: 1 vCPU (odporúčané 2+ vCPU)

### Softvér
- **Docker** 20.10+
- **Docker Compose** v2.0+
- **Nginx** (voliteľné, už v Docker)
- **Certbot** (pre SSL certifikáty)

### Doména
- Zaregistrovaná doména (napr. `blackrent.sk`)
- DNS záznamy nasmerované na váš server

## 🛠️ Inštalácia na server

### 1. Príprava servera

```bash
# Aktualizácia systému
sudo apt update && sudo apt upgrade -y

# Inštalácia Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Inštalácia Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Inštalácia Certbot
sudo apt install certbot -y

# Reštart pre aplikovanie zmien
sudo reboot
```

### 2. Stiahnutie aplikácie

```bash
# Klonovananie repository (alebo upload súborov)
git clone https://github.com/your-username/blackrent.git
cd blackrent

# Alebo upload cez SCP/SFTP
scp -r blackrent-new/ user@your-server:/home/user/
```

### 3. Konfigurácia

```bash
# Kopírovanie a úprava environment súboru
cp production.env .env
nano .env
```

**Dôležité nastavenia v `.env`:**
```bash
# Zmente na vašu doménu
FRONTEND_URL=https://blackrent.sk
DOMAIN=blackrent.sk

# Silné heslo pre databázu
DB_PASSWORD=velmi-silne-heslo-123!

# Silný JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Váš email pre SSL certifikáty
SSL_EMAIL=admin@blackrent.sk
```

### 4. Nasadenie

```bash
# Spustenie deployment scriptu
./deploy.sh

# Alebo manuálne
docker-compose up -d
```

## 🔒 SSL Certifikáty

### Let's Encrypt (odporúčané)

```bash
# Zastavenie nginx ak beží
sudo systemctl stop nginx

# Získanie certifikátov
sudo certbot certonly --standalone -d blackrent.sk -d www.blackrent.sk

# Skopírovanie certifikátov
sudo cp /etc/letsencrypt/live/blackrent.sk/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/blackrent.sk/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*

# Automatické obnovenie
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Cloudflare (alternatíva)

Ak používate Cloudflare:
1. Nastavte SSL/TLS na "Full (strict)"
2. Vytvorte Origin Certificate
3. Uložte do `nginx/ssl/`

## 🌐 DNS Konfigurácia

Nastavte tieto DNS záznamy:

```
A     blackrent.sk        YOUR_SERVER_IP
A     www.blackrent.sk    YOUR_SERVER_IP
CNAME api.blackrent.sk    blackrent.sk
```

## 🔧 Finálne nastavenie

### 1. Aktualizácia nginx konfigurácie

Upravte `nginx/nginx.conf`:
```nginx
server_name blackrent.sk www.blackrent.sk;
```

### 2. Reštart aplikácie

```bash
./deploy.sh restart
```

### 3. Kontrola

```bash
# Stav služieb
./deploy.sh status

# Logy
./deploy.sh logs

# Zdravie aplikácie
curl https://blackrent.sk/health
```

## 📊 Monitoring a údržba

### Automatické zálohovanie

```bash
# Manuálna záloha
./deploy.sh backup

# Automatické denné zálohy (crontab)
echo "0 2 * * * cd /path/to/blackrent && ./deploy.sh backup" | crontab -
```

### Aktualizácie

```bash
# Stiahnutie novej verzie
git pull

# Rebuild a restart
./deploy.sh deploy
```

### Monitoring

```bash
# Sledovanie logov v reálnom čase
docker-compose logs -f

# Využitie zdrojov
docker stats

# Stav databázy
docker-compose exec postgres psql -U postgres -d blackrent -c "SELECT COUNT(*) FROM vehicles;"
```

## 🛡️ Bezpečnosť

### Firewall

```bash
# UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

### Failover

```bash
# Automatický restart pri páde
sudo systemctl enable docker
echo "@reboot cd /path/to/blackrent && ./deploy.sh start" | crontab -
```

### Zmena admin hesla

```bash
# Pripojenie k databáze
docker-compose exec postgres psql -U postgres -d blackrent

# Zmena hesla (nahraďte 'nove-heslo')
UPDATE users SET password_hash = '$2a$10$hash' WHERE username = 'admin';
```

## 🚨 Troubleshooting

### Časté problémy

**Aplikácia sa nespúšťa:**
```bash
# Kontrola logov
./deploy.sh logs

# Kontrola portov
sudo netstat -tlnp | grep 5001
```

**Databáza sa nepripojí:**
```bash
# Kontrola PostgreSQL
docker-compose exec postgres pg_isready

# Reset databázy
docker-compose down -v
docker-compose up -d
```

**SSL nefunguje:**
```bash
# Kontrola certifikátov
sudo certbot certificates

# Test SSL
openssl s_client -connect blackrent.sk:443
```

### Performance tuning

```bash
# Zvýšenie connections pre PostgreSQL
echo "max_connections = 100" >> postgresql.conf

# Nginx worker processes
echo "worker_processes auto;" >> nginx/nginx.conf
```

## 🌟 Pokročilé funkcie

### Horizontálne škálovanie

Pre vysokú záťaž:
```yaml
# docker-compose.scale.yml
services:
  blackrent:
    deploy:
      replicas: 3
```

### Load balancing

```nginx
upstream blackrent_backend {
    server blackrent_1:5001;
    server blackrent_2:5001;
    server blackrent_3:5001;
}
```

## 📞 Podpora

### Kontaktné informácie
- GitHub Issues: [your-repo/issues]
- Email: support@blackrent.sk

### Užitočné príkazy

```bash
# Kompletný deployment
./deploy.sh deploy

# Reštart služby
./deploy.sh restart

# Záloha databázy
./deploy.sh backup

# Stav služieb
./deploy.sh status

# Čistenie
./deploy.sh cleanup
```

---

## ✅ Checklist nasadenia

- [ ] Server pripravený s Docker
- [ ] Doména nasmerovaná na server
- [ ] SSL certifikáty nastavené
- [ ] Environment premenné nakonfigurované
- [ ] Aplikácia úspešne spustená
- [ ] Zdravotná kontrola prešla
- [ ] Admin prístup funguje
- [ ] Automatické zálohy nastavené
- [ ] Monitoring nakonfigurovaný
- [ ] Firewall nastavený

**Gratulujeme! 🎉 Blackrent aplikácia je úspešne nasadená na produkčnom serveri.** 