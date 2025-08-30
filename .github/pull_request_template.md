# 🔄 Pull Request

## 📋 Popis zmien
<!-- Stručne popíš čo táto PR robí -->

## 🎯 Typ zmeny
- [ ] 🐛 Bug fix (non-breaking change)
- [ ] ✨ New feature (non-breaking change)
- [ ] 💥 Breaking change (fix alebo feature ktorý mení existujúce API)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚡ Performance improvement

## 🧪 Testing

### Build testy (POVINNÉ)
- [ ] `npm run build` - frontend build prešiel ✅
- [ ] `cd backend && npm run build` - backend build prešiel ✅

### Funkčné testy
- [ ] `npm run test` - unit testy prechádzajú ✅
- [ ] Manuálne testovanie na localhost ✅
- [ ] **TODO:** E2E testy (keď budú implementované)

### Špecifické testy (ak relevantné)
- [ ] PDF generovanie funguje
- [ ] R2 upload/download funguje
- [ ] Email parsing funguje
- [ ] Real-time updates fungujú
- [ ] Mobile responzivita OK

## 🔒 Security checklist
- [ ] Žiadne secrets v kóde (používa ENV variables)
- [ ] API endpoints majú proper validation (Zod)
- [ ] File uploads používajú presigned URLs
- [ ] Database queries sú parameterizované

## 🖼️ Screenshots / Loom (ak relevantné)
- [ ] Priložené UI náhľady alebo krátke video

## 💥 Breaking changes / migrácie
- [ ] Popísané, čo musí spraviť infra/DB (migrácia, seed, flags)
- [ ] Je definovaný rollback (git revert / flag OFF)

## 🔙 Rollback stratégia
- [ ] popis: ako vypnúť feature flag / revertnúť release / obnoviť migráciu

## 📊 Performance impact
- [ ] Bundle size impact checked (ak relevantné)
- [ ] Database query performance OK
- [ ] Memory usage acceptable
- [ ] No console.log v production kóde

## 🎛️ Feature flags (ak relevantné)
<!-- Ak používaš feature flags, popíš ktoré -->
- [ ] Nové features sú za feature flag
- [ ] Flag dokumentácia aktualizovaná

## 📱 Mobile testing
- [ ] Responzivita testovaná
- [ ] Touch interactions fungujú
- [ ] Performance na mobile OK

## 🔄 Database zmeny (ak relevantné)
- [ ] Migration skripty vytvorené
- [ ] Backup pred migration
- [ ] Rollback plán pripravený
- [ ] **TODO:** Production migration plan

## 📚 Dokumentácia
- [ ] README aktualizované (ak relevantné)
- [ ] API dokumentácia aktualizovaná
- [ ] Architecture docs aktualizované

## 🚀 Deployment
- [ ] Railway environment variables nastavené
- [ ] R2 storage konfigurácia OK
- [ ] Health check endpoint funguje
- [ ] **TODO:** Smoke tests po deploy

## 📝 Poznámky pre reviewer
<!-- Akékoľvek dodatočné informácie pre review -->

## 🔗 Súvisiace issues/PRs
<!-- Linky na related issues alebo PRs -->

---

### 🚨 Pre EMERGENCY fixes
Ak je toto emergency fix:
- [ ] Problém je kritický pre produkciu
- [ ] Fix je minimálny a targeted
- [ ] Manual testing completed
- [ ] Rollback plán pripravený
