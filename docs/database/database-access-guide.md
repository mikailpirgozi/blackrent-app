# 🗄️ Database Direct Access Guide

## 🎯 **Cieľ:**
Dať AI asistentovi priamy prístup k PostgreSQL databáze pre pokročilé monitoring, diagnostiku a optimalizácie.

## 📋 **Krok za krokom:**

### **KROK 1: Otvor Railway Dashboard**
1. Choď na **https://railway.app**
2. Otvor projekt **blackrent-app**

### **KROK 2: Database Section**
1. Klikni na **Database** službu v projekte
2. Klikni na **"Connect"** tab
3. Uvidíš connection details

### **KROK 3: Skopíruj Connection String**
1. Nájdi **"Connection String"** alebo **"DATABASE_URL"**
2. **Skopíruj celý connection string**
3. Vyzerá asi takto:
```
postgresql://postgres:password@host:port/database
```

### **KROK 4: Bezpečnosť - Vytvor AI User (Odporúčané)**

#### **Option A: Priamy prístup (rýchle)**
Jednoducho mi pošli connection string:
```
Database: postgresql://postgres:password@host:port/database
```

#### **Option B: Vytvor AI user (bezpečnejšie)**
1. Pripoj sa k databáze cez Railway console
2. Spusti tieto SQL príkazy:
```sql
-- Vytvor AI user-a
CREATE USER ai_assistant WITH PASSWORD 'secure_ai_password_123';

-- Daj permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ai_assistant;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ai_assistant;
GRANT CREATE ON SCHEMA public TO ai_assistant;

-- Pre budúce tabuľky
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ai_assistant;
```

3. Pošli mi connection string s AI user-om:
```
postgresql://ai_assistant:secure_ai_password_123@host:port/database
```

### **KROK 5: Pošli mi connection string**
```
Database: tvoj_connection_string_tu
```

## ✅ **Po nastavení budem môcť:**

### **📊 Diagnostika a Analytics:**
- **Database performance** monitoring
- **Query performance** analysis
- **Table sizes** a storage usage
- **Index usage** statistics
- **Connection pool** monitoring

### **🔄 Maintenance:**
- **Automated backups** skutočné
- **Schema optimalizácie** 
- **Index recommendations**
- **Query optimization** suggestions
- **Deadlock detection**

### **🚨 Monitoring:**
- **Real-time database health**
- **Slow query detection**
- **Connection monitoring**
- **Storage usage alerts**
- **Performance regression** detection

### **🛠️ Operácie:**
- **Database migrations** support
- **Data integrity** checks
- **Performance tuning**
- **Capacity planning**

## 🧪 **Testovanie po nastavení:**
```bash
# Test database connection
./ai-automation.sh backup

# Database health check
./ai-automation.sh status

# Database performance analysis
./ai-automation.sh analytics
```

## 🔒 **Bezpečnosť:**
- Connection string je citlivá informácia
- AI user má obmedzené permissions
- Môžeš kedykoľvek zmeniť heslo
- Audit log všetkých operácií

## 🚨 **Troubleshooting:**

### **Ak nevidíš Database service:**
- Skontroluj správny projekt
- Refresh Railway dashboard
- Skontroluj permissions

### **Ak connection string nefunguje:**
- Skontroluj syntax
- Skontroluj hostname/port
- Skontroluj credentials

### **Ak máš problémy s permissions:**
- Použi admin user pre vytvorenie AI user-a
- Skontroluj SQL syntax
- Skontroluj database permissions

## 📱 **Railway Database URLs:**
```
1. Railway Dashboard: https://railway.app
2. Project: blackrent-app
3. Database Connect: railway.app/project/[project-id]/service/[db-id]
```

## 🎯 **Aktuálna databáza:**
```
Type: PostgreSQL
Status: 🟢 Active
Integration: Railway
Current backups: Simulované (budú skutočné)
```

---

**Po nastavení database access pokračujeme na Webhooks! 🔔** 