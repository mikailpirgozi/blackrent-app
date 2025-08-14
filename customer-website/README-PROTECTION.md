# 🛡️ BlackRent Protection - Rýchly Návod

## 🚨 DÔLEŽITÉ: Pred každou prácou spustite

```bash
npm run protect
```

## 🚀 Bezpečné spustenie servera

```bash
npm run safe-start
```

## 💾 Záloha pred zmenami

```bash
npm run backup
```

## ❌ Čo je ZAKÁZANÉ v `src/app/page.tsx`:

- `HeroSection` (Tesla banner)
- `BrandLogosSection` (duplicitné logá) 
- `ChatButton` (chat tlačidlo)

## ✅ Čo je POVOLENÉ:

- `HeaderSection`
- `FeaturedItemsSection` 
- `ContactSection`

## 🔧 Ak sa niečo pokazí:

1. `npm run protect` - diagnostika
2. Opravte chyby v `src/app/page.tsx`
3. `npm run protect` - znovu kontrola

---

**📖 Kompletná dokumentácia:** `PROTECTION-GUIDE.md`
