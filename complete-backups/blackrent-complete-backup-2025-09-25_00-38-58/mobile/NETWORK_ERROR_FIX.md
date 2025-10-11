# 🔧 Riešenie Network Error v mobilnej aplikácii

## ❌ Problém
Aplikácia zobrazuje `Network Error` keď sa pokúša pripojiť na backend API.

## 🔍 Príčina
1. **Backend nebeží** - musí bežať na porte 3001
2. **Nesprávna IP adresa** - mobilná aplikácia nemôže použiť `localhost`

## ✅ Riešenie

### Možnosť 1: Automatické spustenie všetkého (ODPORÚČANÉ)
```bash
cd apps/mobile
./start-all.sh
```
Tento script:
- ✅ Spustí backend
- ✅ Automaticky zistí vašu IP adresu
- ✅ Spustí mobilnú aplikáciu s správnou konfiguráciou

### Možnosť 2: Manuálne spustenie

#### Krok 1: Spustite backend
```bash
cd backend
npm run dev
```

#### Krok 2: Zistite vašu IP adresu
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Výstup bude napríklad: `inet 192.168.1.12`

#### Krok 3: Nastavte API URL
```bash
cd apps/mobile
echo "EXPO_PUBLIC_API_URL=http://192.168.1.12:3001/api" > .env.local
```
(Nahraďte `192.168.1.12` vašou IP adresou)

#### Krok 4: Spustite mobilnú aplikáciu
```bash
pnpm expo start --clear
```

## 🚨 Časté problémy

### "Network Error" aj po týchto krokoch
1. **Firewall** - povoľte port 3001
2. **Nesprávna sieť** - uistite sa že mobil a počítač sú na rovnakej WiFi
3. **Backend padol** - skontrolujte `ps aux | grep backend`

### Backend sa nespustí
```bash
# Ukončite všetky staré procesy
pkill -f "node.*backend"

# Spustite znova
cd backend
npm run dev
```

### IP adresa sa zmenila
- Pri zmene WiFi siete musíte aktualizovať IP adresu
- Použite `./start-all.sh` - automaticky zistí novú IP

## 💡 Tips

1. **Pre development vždy používajte `./start-all.sh`**
2. **IP adresa sa mení** keď prepnete WiFi alebo reštartujete router
3. **Backend musí bežať** pred spustením mobilnej aplikácie

## 📱 Testovanie na fyzickom zariadení

1. Uistite sa že telefón je na **rovnakej WiFi** ako počítač
2. V Expo Go aplikácii zadajte: `exp://192.168.1.12:8081`
3. Ak nefunguje, skontrolujte firewall nastavenia

---

*Ak stále máte problémy, skontrolujte že backend API odpoveda:*
```bash
curl http://localhost:3001/api/health
```
