# 🚨 OpenAI API Fix Guide - BlackRent Mobile

## 🔍 **IDENTIFIKOVANÝ PROBLÉM**

Chatbot v BlackRent mobilnej aplikácii nefunguje kvôli **prekročenej kvóte** na OpenAI API kľúči.

### **Chybová správa:**
```
You exceeded your current quota, please check your plan and billing details.
Error Code: insufficient_quota
```

---

## ✅ **ČO FUNGUJE SPRÁVNE**

### **1. Implementácia je kompletná** ✅
- ✅ AI Chatbot Service je správne implementovaný
- ✅ Environment variables sa načítavajú správne
- ✅ API kľúč je nastavený v `.env` súbore
- ✅ Fallback riešenie je implementované
- ✅ Error handling funguje správne

### **2. Kód je production-ready** ✅
- ✅ Multi-language podpora (SK, CS, DE, HU, EN)
- ✅ Context-aware konverzácie
- ✅ Session persistence
- ✅ Graceful error handling
- ✅ Retry mechanizmy

---

## 🔧 **RIEŠENIE PROBLÉMU**

### **Krok 1: Nastavenie OpenAI Billing** 💳

1. **Choďte na OpenAI Platform:**
   ```
   https://platform.openai.com/account/billing
   ```

2. **Pridajte platobnú metódu:**
   - Kliknite "Add payment method"
   - Zadajte údaje kreditnej karty
   - Potvrďte platbu

3. **Nastavte billing limit:**
   - Odporúčané: $10-20 mesačne pre development
   - Pre produkciu: $50-100 podľa použitia

4. **Počkajte na aktiváciu:**
   - Aktivácia trvá 5-10 minút
   - Skontrolujte email potvrdenie

### **Krok 2: Overenie API kľúča** 🔑

```bash
# Test API kľúča
node test-openai-api.js
```

**Očakávaný výstup:**
```
✅ OpenAI API funguje správne!
🤖 AI Odpoveď: Ahoj! Som BlackRent AI asistent...
💰 Tokens použité: 45
```

### **Krok 3: Test v aplikácii** 📱

1. **Spustite aplikáciu:**
   ```bash
   pnpm expo start
   ```

2. **Otvorte v Expo Go**

3. **Testujte chatbot:**
   - Kliknite na chatbot ikonu
   - Napíšte: "Ahoj, potrebujem pomoc"
   - Očakávajte AI odpoveď

---

## 🛡️ **FALLBACK RIEŠENIE**

Ak OpenAI API zlyhá, aplikácia automaticky zobrazí:

```
😔 Prepáčte, momentálne mám technické problémy. 
Môžem vás prepojiť s našou ľudskou podporou?
```

**Fallback features:**
- ✅ Automatické prepojenie na ľudskú podporu
- ✅ Retry tlačidlo
- ✅ Graceful degradation
- ✅ Multi-language error messages

---

## 📊 **MONITORING & DEBUGGING**

### **Test Script použitie:**
```bash
# Kompletný test
node test-openai-api.js

# Len API test
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

### **Logs v aplikácii:**
```javascript
// V AI Chatbot Service
console.error('AI Chatbot Service Error:', error);

// V AI Chatbot Component  
console.error('Error sending message:', error);
```

---

## 💰 **COST OPTIMIZATION**

### **Odporúčané nastavenia:**
```javascript
// V ai-chatbot-service.ts
{
  model: 'gpt-4o-mini',        // Najlacnejší model
  max_tokens: 500,             // Limit tokenov
  temperature: 0.7,            // Optimálna kreativita
  presence_penalty: 0.1,       // Znižuje opakovaní
  frequency_penalty: 0.1       // Znižuje redundanciu
}
```

### **Rate limiting:**
```javascript
// Delay medzi requestmi
await new Promise(resolve => setTimeout(resolve, 1000));
```

### **Mesačné náklady (odhad):**
- **Development:** $5-10
- **Production (1000 users):** $20-50
- **Enterprise:** $100-300

---

## 🔐 **SECURITY BEST PRACTICES**

### **API Key Security:**
```env
# ✅ Správne - v .env súbore
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# ❌ Nesprávne - v kóde
const apiKey = "your_api_key_here"
```

### **Environment Variables:**
```javascript
// ✅ Správne načítanie
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// ✅ Validácia
if (!apiKey) {
  throw new Error('OpenAI API key not configured');
}
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Pre EAS Build:**
```json
// V eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_OPENAI_API_KEY": "your_production_api_key_here"
      }
    }
  }
}
```

### **Environment Variables:**
```bash
# Development
EXPO_PUBLIC_OPENAI_API_KEY=your_dev_api_key_here

# Production  
EXPO_PUBLIC_OPENAI_API_KEY=your_prod_api_key_here
```

---

## 📞 **SUPPORT & HELP**

### **OpenAI Support:**
- 📧 Email: support@openai.com
- 📖 Docs: https://platform.openai.com/docs
- 💬 Community: https://community.openai.com

### **BlackRent Internal:**
- 🔧 Test Script: `node test-openai-api.js`
- 📋 Logs: Console v Expo Go
- 🐛 Debug: React Native Debugger

---

## ✅ **CHECKLIST PRE RIEŠENIE**

- [ ] **Billing nastavený** na OpenAI Platform
- [ ] **Platobná metóda** pridaná a aktívna  
- [ ] **API kľúč** funguje (test script)
- [ ] **Environment variables** správne nastavené
- [ ] **Aplikácia** sa spúšťa bez chýb
- [ ] **Chatbot** odpovedá na správy
- [ ] **Fallback** funguje pri chybách
- [ ] **Production** deployment pripravený

---

## 🎉 **ZÁVER**

**Problém:** OpenAI API kvóta prekročená  
**Riešenie:** Nastavenie billing na OpenAI Platform  
**Čas riešenia:** 5-10 minút  
**Náklady:** $10-20/mesiac pre development  

**Po vyriešení billing problému bude chatbot plne funkčný!** 🚀

---

*Posledná aktualizácia: 11.9.2025*
