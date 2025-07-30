# 🚀 Automatické nasadenie na Railway

Všetky zmeny sa automaticky nasadia na Railway cez GitHub integration.

## 📋 Dostupné príkazy

### 1. **Jednorázové nasadenie**
```bash
./auto-deploy.sh
```

### 2. **Automatické sledovanie zmien**
```bash
./auto-watch-deploy.sh
```

### 3. **Nasadenie s vlastnou správou**
```bash
./auto-deploy.sh "moja vlastná commit správa"
```

## 🎯 Čo sa deje pri nasadení

1. **Automaticky pridá všetky zmeny** (`git add -A`)
2. **Vytvorí commit** s time stamp
3. **Pushne na GitHub** (`git push origin main --force-with-lease`)
4. **Railway automaticky nasadí** zmeny za 2-5 minút

## 🔍 Sledovanie deployment

- **URL aplikácie**: https://blackrent-app-production-4d6f.up.railway.app
- **Railway Dashboard**: https://railway.app/project/your-project
- **GitHub Repository**: https://github.com/mikailpirgozi/blackrent-app

## 💡 Tipy

- **Auto-watch** sleduje zmeny v reálnom čase a automaticky nasadí každú zmenu
- **Používaj fswatch** na macOS pre lepšiu performance: `brew install fswatch`
- **Ctrl+C** ukončí auto-watch monitoring

## 📱 Podporované súbory

- **TypeScript/JavaScript**: `*.tsx`, `*.ts`, `*.js`, `*.jsx`
- **Štýly**: `*.css`
- **Config**: `*.json`, `Dockerfile`
- **Dokumentácia**: `*.md`

## 🎉 Automatické features

- ✅ **Persistent session** s cookies (90 dní)
- ✅ **Optimistic restore** - okamžité obnovenie session
- ✅ **Periodické obnovenie** - každých 30 sekúnd
- ✅ **Cross-tab synchronization**
- ✅ **Visibility handling** - overenie pri návrate

---

**Všetky zmeny sa automaticky nasadia na Railway bez nutnosti manuálneho zásahu!** 🚀✨ 