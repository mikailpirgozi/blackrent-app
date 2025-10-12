# 🔧 Railway GitHub Auto-Deploy Setup

## 🚨 PROBLÉM:
Railway **NEREAGUJE** na GitHub push automaticky. Musíš manuálne triggernúť deployment.

## ✅ RIEŠENIE - Nastavenie v Railway Dashboard:

### **1. Otvor Railway Dashboard:**
https://railway.app/dashboard → **blackrent-app** project → **blackrent-app** service

### **2. Klikni na "Settings" tab**

### **3. Scroll na "Source" sekciu**

#### **Over tieto nastavenia:**

**Source Repo:**
- ✅ Connected to: `mikailpirgozi/blackrent-app`
- ✅ Branch: `main`
- ✅ Root Directory: `/` (alebo prázdne - railway.json to rieši)

**Deploy Triggers:**
- ✅ **Auto-Deploy:** ON (zapnuté)
- ❌ **Wait for CI:** OFF (vypnuté)
- ✅ **PR Previews:** OFF (voliteľné)

### **4. AK JE "Wait for CI" ZAPNUTÉ:**
- Klikni na toggle → **VYPNI ho**
- Save

### **5. AK "Auto-Deploy" JE VYPNUTÉ:**
- Klikni na toggle → **ZAPNI ho**
- Save

---

## 🔍 ALTERNATÍVNE RIEŠENIE - Webhook:

Ak auto-deploy nefunguje, Railway možno **stratil GitHub webhook**.

### **Reset GitHub Connection:**

1. **Railway Settings** → Source
2. Klikni **"Disconnect"**
3. Počkaj 5 sekúnd
4. Klikni **"Connect GitHub Repo"**
5. Vyber: `mikailpirgozi/blackrent-app`
6. Branch: `main`
7. Root: `/` (prázdne)
8. **Connect**

---

## ✅ OTESTUJ:

Po nastavení:

```bash
cd backend
echo "# Test auto-deploy $(date)" >> .test-deploy
git add .test-deploy
git commit -m "test: Railway auto-deploy test"
git push origin main
```

**Sleduj Railway Dashboard** - za ~30 sekúnd by sa mal objaviť **nový deployment**!

---

## 📋 CURRENT STATUS:

- ✅ GitHub Actions: FUNGUJÚ (CI prebieha)
- ✅ Vercel: AUTO-DEPLOY funguje
- ❌ Railway: AUTO-DEPLOY NEFUNGUJE (musíš manuálne)

**FIX:** Reconnect GitHub repo v Railway Settings!

