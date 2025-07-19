# 🔗 GitHub + Vercel Prepojenie

## ✅ Úspešne nastavené

### 1. Vercel CLI inštalácia
```bash
npm install -g vercel
```

### 2. Prihlásenie do Vercel
```bash
vercel login
# Prihlásenie cez GitHub účet
```

### 3. Prepojenie projektu
```bash
vercel link --yes
# Projekt: blackrents-projects/blackrent-new
```

### 4. GitHub prepojenie
```bash
vercel git connect
# Repozitár: https://github.com/mikailpirgozi/blackrent-app.git
```

## 🚀 Automatické nasadenie

### Aktívne URL
- **Produkcia**: https://blackrent-a7vmj39hb-blackrents-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/blackrents-projects/blackrent-new

### Workflow
1. **Push do GitHub** → Automatické nasadenie na Vercel
2. **Každý commit** → Nové nasadenie
3. **Pull Request** → Preview deployment

## 📋 Environment Variables

Nastavené v `vercel.json`:
```json
{
  "env": {
    "REACT_APP_API_URL": "https://blackrent-app-production-4d6f.up.railway.app/api",
    "ESLINT_NO_DEV_ERRORS": "true",
    "TSC_COMPILE_ON_ERROR": "true",
    "GENERATE_SOURCEMAP": "false"
  }
}
```

## 🔧 Konfigurácia

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "framework": "create-react-app"
}
```

## 📊 Stav nasadenia

### Posledné nasadenia:
- ✅ **Ready**: https://blackrent-oyuvu9rxi-blackrents-projects.vercel.app
- 🔄 **Building**: Automatické nasadenie po push
- ⏳ **Queued**: Čaká na spracovanie

## 🎯 Výhody

✅ **Automatické nasadenie** - každý push = nové nasadenie  
✅ **Preview deployments** - pre Pull Requests  
✅ **SSL certifikát** - automaticky  
✅ **CDN** - globálne rozloženie  
✅ **Zero config** - minimálna konfigurácia  
✅ **GitHub integration** - priame prepojenie  

## 🔍 Monitoring

### Príkazy pre kontrolu:
```bash
# Zobraziť všetky nasadenia
vercel ls

# Zobraziť stav projektu
vercel project ls

# Otvoriť dashboard
vercel open

# Environment variables
vercel env ls
```

## 📝 Poznámky

- **Backend**: Stále na Railway (PostgreSQL + API)
- **Frontend**: Teraz na Vercel (automatické nasadenie)
- **Doména**: Automaticky generovaná Vercel URL
- **Custom doména**: Možné nastaviť v Vercel dashboard

---

**Vytvorené**: $(date)  
**Status**: ✅ Aktívne a funkčné 