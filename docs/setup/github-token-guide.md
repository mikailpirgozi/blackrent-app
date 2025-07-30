# 🔑 GitHub Personal Access Token - Detailný Guide

## 📋 **Krok za krokom:**

### **KROK 1: Otvor GitHub Settings**
1. Choď na **GitHub.com**
2. Klikni na svoj **avatar/profil obrázok** (pravý horný roh)
3. V dropdown menu klikni na **"Settings"**

### **KROK 2: Developer Settings**
1. V ľavom menu (v Settings) scroll úplne dole
2. Klikni na **"Developer settings"** (posledná položka)

### **KROK 3: Personal Access Tokens**
1. V ľavom menu klikni **"Personal access tokens"**
2. Potom klikni **"Tokens (classic)"** 
   - **DÔLEŽITÉ:** Použij "classic", nie "Fine-grained"

### **KROK 4: Generate New Token**
1. Klikni na **"Generate new token"**
2. Vyber **"Generate new token (classic)"**
3. Možno budeš musieť potvrdiť heslo

### **KROK 5: Nastavenie Token-u**

#### **Note (popis):**
```
AI Assistant - BlackRent Automation
```

#### **Expiration:**
- Vyber **"90 days"** alebo **"No expiration"** (ak chceš dlhodobé riešenie)

#### **Permissions (najdôležitejšie!):**
Zaškrtni tieto permissions:

✅ **repo** (Full control of private repositories)
- [x] repo:status
- [x] repo_deployment
- [x] public_repo
- [x] repo:invite
- [x] security_events

✅ **workflow** (Update GitHub Action workflows)
- [x] workflow

✅ **write:packages** (Upload packages)
- [x] write:packages
- [x] read:packages

✅ **admin:repo_hook** (Admin access to repository hooks)
- [x] admin:repo_hook

### **KROK 6: Generate Token**
1. Scroll dole a klikni **"Generate token"**
2. **DÔLEŽITÉ:** Token sa zobrazí len raz!
3. **Skopíruj token** (začína `ghp_`)

### **KROK 7: Uloženie Token-u**
```bash
# Token vyzerá asi takto:
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔒 **Bezpečnosť:**
- Token je ako heslo - nikdy ho nezdieľaj
- Uložiť si ho niekde bezpečne
- Ak ho stratíš, musíš vytvoriť nový
- Môžeš ho kedykoľvek revoke (zrušiť)

## 🎯 **Po vytvorení token-u:**

### **Spôsob A: Priamo v .env.ai**
```bash
# Edituj súbor .env.ai
vim .env.ai

# Pridaj riadok:
GITHUB_TOKEN=ghp_tvoj_token_tu
```

### **Spôsob B: Cez GitHub repository secret**
1. Choď na: https://github.com/mikailpirgozi/blackrent-app/settings/secrets/actions
2. Klikni "New repository secret"
3. Name: `GITHUB_TOKEN`
4. Secret: `ghp_tvoj_token_tu`

### **Spôsob C: Jednoducho mi ho pošli**
- Môžeš mi token poslať priamo v chate
- Použijem ho pre AI automatizácie

## 🧪 **Testovanie:**
Po nastavení otestujeme:
```bash
# Test GitHub API prístupu
curl -H "Authorization: token ghp_tvoj_token" https://api.github.com/user

# Test AI automatizácií
./ai-automation.sh deploy
```

## 🚨 **Troubleshooting:**

### **Ak nevidíš "Developer settings":**
- Skontroluj, či si prihlásený
- Refresh stránky
- Skús iný prehliadač

### **Ak nemáš dostatočné permissions:**
- Skontroluj, či si vlastník/admin repository
- Skús osobný účet namiesto organization

### **Ak token nefunguje:**
- Skontroluj, či má správne permissions
- Skontroluj expiration date
- Vytvor nový token

## 📱 **URL pre rýchly prístup:**
```
1. GitHub Settings: https://github.com/settings/profile
2. Developer Settings: https://github.com/settings/apps
3. PAT Classic: https://github.com/settings/tokens
4. New Token: https://github.com/settings/tokens/new
```

---

**Po vytvorení token-u ma informuj a pokračujeme na Railway! 🚂** 