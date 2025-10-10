# 📚 BlackRent Dokumentácia

Kompletná dokumentácia pre BlackRent systém - autopožičovňa management aplikácia.

---

## 🏗️ Monorepo Dokumentačná Štruktúra

BlackRent používa **monorepo** s oddelenými docs pre každý projekt:

### 📱 Project-Specific Docs
- **[apps/web/docs/](../apps/web/docs/)** - Web app (interná aplikácia)
- **[apps/mobile/docs/](../apps/mobile/docs/)** - Mobile app (React Native)
- **[customer-website/docs/](../customer-website/docs/)** - Customer website
- **[backend/docs/](../backend/docs/)** - Backend API

### 🌐 Shared/Global Docs (tento priečinok)
Dokumentácia zdieľaná medzi všetkými projektmi.

---

## 📖 Organizácia Dokumentácie

### [01 - Getting Started](./01-getting-started/)
Základné príručky pre rýchly štart a setup projektu.

- **QUICK-START.md** - Rýchly štart pre nových vývojárov
- **QUICK_START_GUIDE.md** - Kompletný quick start guide
- **PROJECT_SETUP_GUIDE.md** - Detailný setup guide
- **WORKSPACE-GUIDE.md** - Práca s workspace
- **DEPLOYMENT_GUIDE.md** - Deployment príručka
- **FINAL_DEPLOYMENT_AND_TESTING.md** - Finálny deployment a testing
- **COMPLETE_AUTH_FINAL.md** - Kompletná auth dokumentácia
- **UI_IMPLEMENTATION_COMPLETE.md** - UI implementácia
- **PERMISSION_UI_GUIDE.md** - Permission systém UI
- **FINAL_SUMMARY.md** - Finálne zhrnutie projektu

---

### [02 - Architecture](./architecture/)
Architektúra systému a dizajnové rozhodnutia.

- **ARCHITECTURE.md** - Prehľad architektúry
- **overview.md** - Systémový overview
- **sections.md** - Sekcie aplikácie
- **decisions.md** - Architektúrne rozhodnutia
- **ROLE-SYSTEM-DESIGN.md** - Design role systému
- **FILTER-ARCHITECTURE-PROPOSAL.md** - Filter architektúra
- **BRANCH_STRATEGY.md** - Git branch stratégia
- **MONOREPO_STRUCTURE.md** - Monorepo štruktúra
- **TYPESCRIPT_BEST_PRACTICES.md** - TypeScript best practices

---

### [03 - Features](./features/)
Dokumentácia jednotlivých features a funkcionalít.

- **API-RESPONSE-CACHING-GUIDE.md** - API response caching
- **COMPANY-DOCUMENTS-GUIDE.md** - Firemné dokumenty
- **EMAIL-MONITORING-AUTOMATION.md** - Email monitoring
- **EMAIL-SETUP-GUIDE.md** - Email setup
- **ENHANCED-SEARCH-FILTERS-GUIDE.md** - Pokročilé search filtre
- **GMAIL-STYLE-SEARCH-IMPLEMENTATION.md** - Gmail-štýl search
- **PRAVIDELNE-NAKLADY-GUIDE.md** - Pravidelné náklady
- **PROTOCOL-EMAIL-STRATEGY.md** - Protocol email stratégia
- **PWA-FEATURES-GUIDE.md** - PWA features
- **TECHNICAL-CERTIFICATE-GUIDE.md** - Technické certifikáty

---

### [04 - Implementation Plans](./04-implementation-plans/)
Implementačné plány a analýzy.

- **CLONE_RENTAL_IMPLEMENTATION_PLAN.md** - Clone rental funkcia
- **COMPLETE_MIGRATION_FINALIZATION_PLAN.md** - Migrácia finalizácia
- **REACT_QUERY_IMPLEMENTATION_PLAN.md** - React Query implementácia
- **REACT_QUERY_MIGRATION_PLAN.md** - React Query migrácia
- **REACT_QUERY_MIGRATION_COMPLETE_PLAN.md** - Kompletná React Query migrácia
- **PROTOCOL_V2_MIGRATION_PLAN.md** - Protocol V2 migrácia
- **V1_PROTOCOL_MINIMAL_IMPROVEMENT_PLAN.md** - V1 Protocol vylepšenia
- **WEBP_QUALITY_OPTIMIZATION_PLAN.md** - WebP optimalizácia
- **STARTUP_OPTIMIZATION_REPORT.md** - Startup optimalizácia
- **SYSTEM_AUDIT_REPORT.md** - Systémový audit
- **SYSTEM-ANALYSIS-COMPLETE-REPORT.md** - Kompletná systémová analýza
- **RENTAL_DAYS_CALCULATION_ANALYSIS.md** - Analýza výpočtu rental days
- **DUPLICATE_VEHICLE_CHECK_IMPLEMENTATION.md** - Duplicate vehicle check
- **CHAT_HANDOVER_STATISTICS.md** - Chat handover štatistiky
- **SMART_PRIORITY_SORTING.md** - Smart priority sorting

---

### [05 - Deployment](./deployment/)
Deployment príručky a konfigurácie.

- **DEPLOY.md** - Základný deployment
- **DEPLOYMENT-GUIDE.md** - Deployment guide
- **QUICK-DEPLOY.md** - Rýchly deployment
- **PRODUCTION-SETUP.md** - Production setup
- **AUTO-DEPLOY-SETUP.md** - Automatický deployment
- **AUTO-DEPLOY-README.md** - Auto-deploy readme
- **RAILWAY-DEPLOY.md** - Railway deployment
- **RAILWAY-DEPLOYMENT-STEPS.md** - Railway deployment kroky
- **RAILWAY-ENVIRONMENT-SETUP.md** - Railway environment
- **VERCEL-DEPLOY.md** - Vercel deployment
- **VERCEL-GITHUB-SETUP.md** - Vercel GitHub setup
- **CLOUDFLARE-R2-SETUP.md** - Cloudflare R2 setup
- **CLOUDFLARE-WORKER-SETUP.md** - Cloudflare Worker
- **R2-TOKEN-SETUP-GUIDE.md** - R2 token setup
- **PUPPETEER-INTEGRATION-COMPLETE.md** - Puppeteer integrácia
- **MANUAL_RAILWAY_REDEPLOY.md** - Manuálny Railway redeploy
- **RAILWAY_GITHUB_SETUP.md** - Railway GitHub setup
- **RAILWAY_MANUAL_REDEPLOY.md** - Railway manual redeploy
- **PRODUCTION_DEPLOYMENT_CHECKLIST.md** - Production deployment checklist
- **HOW_TO_RUN_MIGRATION.md** - Ako spustiť migrácie
- **FRONTEND_REFRESH_STEPS.md** - Frontend refresh kroky
- **FULL_STACK_FIELD_CHECKLIST.md** - Full stack field checklist

---

### [06 - Database](./database/)
Databázová dokumentácia a migrácie.

- **database-access-guide.md** - Prístup k databáze
- **DATABASE-DIAGNOSTIC-REPORT.md** - Diagnostický report
- **BLACKRENT-DATABASE-CLEANUP-DOCUMENTATION.md** - Cleanup dokumentácia
- **BLACKRENT-DATABASE-CLEANUP-QUICKSTART.md** - Cleanup quickstart
- **FLEXIBLE-RENTALS-SOLUTION.md** - Flexible rentals riešenie
- **MIGRATION-OPTIMIZATION.md** - Optimalizácia migrácií
- **MIGRATION-SUMMARY.md** - Zhrnutie migrácií
- **RENTALS-TABLE-ANALYSIS.md** - Analýza rentals tabuľky

---

### [07 - Testing](./07-testing/)
Testovacie príručky a výsledky.

- **final-v2-test-instructions.md** - V2 test inštrukcie
- **test-all-sections.md** - Test všetkých sekcií
- **test-discount-demo.md** - Discount demo test
- **test-discount-system.md** - Discount systém test
- **v2-quick-check.md** - V2 quick check
- **TEST_RESULTS_FINAL.md** - Finálne test výsledky
- **QUICK-DIAGNOSTICS.md** - Rýchla diagnostika
- **test-infinite-scroll.md** - Infinite scroll test

---

### [08 - Fixes & Bugs](./08-fixes-and-bugs/)
Bug fixes a opravy.

- **CRITICAL_BUG_FIX.md** - Kritické bug fixy
- **TIMEZONE_FIX_COMPLETE.md** - Timezone fix kompletný
- **TIMEZONE_FIX_SUCCESS.md** - Timezone fix úspech
- **TIMEZONE_FIX_TEST.md** - Timezone fix test
- **INVESTOR_LOADING_FIX.md** - Investor loading fix
- **INSURANCE_STK_SECTION_FIX_COMPLETE.md** - Insurance STK fix
- **LEASING_SYSTEM_FIXED.md** - Leasing systém fix
- **LEGACY_ADMIN_FIX_COMPLETE.md** - Legacy admin fix
- **GITHUB_WORKFLOWS_FIX.md** - GitHub workflows fix

---

### [09 - Refactoring](./09-refactoring/)
Refactoring dokumenty a plány.

- **EXPENSES_REFACTOR_COMPLETE.md** - Expenses refactoring kompletný
- **AUTH_SYSTEM_REFACTOR_COMPLETE.md** - Auth systém refactoring
- **STATISTICS_REFACTORING_GUIDE.md** - Statistics refactoring
- **VEHICLE_REFACTORING_PROMPT.md** - Vehicle refactoring
- **OTHER_REFACTORING_CANDIDATES.md** - Ďalšie refactoring kandidáti
- **EXPENSES_COMPLETE_ANALYSIS.md** - Expenses kompletná analýza
- **EXPENSES_FIXES_IMPLEMENTED.md** - Expenses fixes implementované
- **EXPENSES_PHASE_1_COMPLETE.md** - Expenses fáza 1 kompletná
- **EXPENSES_PHASE_2_COMPLETE.md** - Expenses fáza 2 kompletná
- **EXPENSES_QUICK_FIX_GUIDE.md** - Expenses quick fix guide
- **EXPENSES_IMPLEMENTATION_STATUS.md** - Expenses implementation status
- **EXPENSE_LIST_VIEW_UPGRADE.md** - Expense list view upgrade

---

### [10 - Performance](./performance/)
Performance optimalizácie.

- **LAZY-LOADING-OPTIMIZATION-GUIDE.md** - Lazy loading optimalizácia
- **MEMOIZATION-OPTIMIZATION-GUIDE.md** - Memoization optimalizácia

---

### [11 - Security](./security/)
Bezpečnostná dokumentácia.

- **DATABASE-SECURITY-REPORT.md** - Databázový security report

---

### [12 - Email System](./12-email-system/)
Email systém dokumentácia.

- **EMAIL-ACTIVATION-STEPS.md** - Email aktivačné kroky
- **EMAIL-PROTOCOL-SUMMARY.md** - Email protocol zhrnutie
- **EMAIL-SETUP-GUIDE.md** - Email setup guide
- **FINAL-EMAIL-SETUP-SUMMARY.md** - Finálne email setup zhrnutie
- **RENTAL_EMAIL_MATCHING_COMPLETE_REPORT.md** - Rental email matching report

---

### [13 - Protocols](./13-protocols/)
Protocol V1 a V2 dokumentácia.

- **HOW_TO_USE_V2_IN_CODE.md** - Ako používať V2 v kóde
- **KOMPLETNY_V2_IMPLEMENTACNY_PLAN.md** - Kompletný V2 implementačný plán
- **PROTOKOLY_DETAILNA_ANALYZA.md** - Detailná analýza protokolov
- **PROTOKOLY_EFEKTIVNE_RIESENIE.md** - Efektívne riešenie protokolov
- **V2_MAPPING_TABLE.md** - V2 mapping tabuľka
- **V2_PROTOKOL_PROBLEMY_ZOZNAM.md** - V2 protokol problémy
- **TESTING_V2_IN_PRODUCTION.md** - Testovanie V2 v produkcii

---

### [14 - Platforms](./14-platforms/)
Platform management dokumentácia.

- **PLATFORM_DEPLOYMENT_GUIDE.md** - Platform deployment guide
- **PLATFORM_IMPLEMENTATION_COMPLETE.md** - Platform implementácia kompletná
- **PLATFORM_IMPLEMENTATION_FINAL_SUMMARY.md** - Platform implementácia finálne zhrnutie
- **PLATFORM_MANAGEMENT_FIX.md** - Platform management fix
- **PLATFORM_STATS_FINAL_FIX.md** - Platform stats finálny fix
- **PLATFORM_STATS_FIX.md** - Platform stats fix
- **PLATFORM_STATS_UUID_FIX.md** - Platform stats UUID fix
- **PLATFORM_MULTI_TENANCY_IMPLEMENTATION_COMPLETE.md** - Multi-tenancy implementácia

---

### [Setup Guides](./setup/)
Setup a konfiguračné príručky.

- **AI-ACCESS-GUIDE.md** - AI access guide
- **DATA-STORAGE.md** - Data storage
- **DEVELOPMENT-WORKFLOW.md** - Development workflow
- **github-access-guide.md** - GitHub access
- **github-token-guide.md** - GitHub token
- **LOKALNE-TESTOVANIE-GUIDE.md** - Lokálne testovanie
- **railway-access-guide.md** - Railway access
- **railway-token-guide.md** - Railway token
- **SENTRY-SETUP-GUIDE.md** - Sentry setup
- **setup-progress.md** - Setup progress

---

### [Guides](./guides/)
Rôzne príručky a návody.

- **CSV-IMPORT-EXPORT-GUIDE.md** - CSV import/export
- **CSV-IMPORT-GUIDE.md** - CSV import
- **ENHANCED-FILTER-USAGE-GUIDE.md** - Enhanced filtre
- **PDF-AND-MOBILE-IMPLEMENTATION.md** - PDF a mobile implementácia
- **QUICK-R2-SETUP.md** - Quick R2 setup
- **QUICK-SETUP.md** - Quick setup
- **QUICK-START-GUIDE.md** - Quick start guide
- **R2-IMPLEMENTATION-SUMMARY.md** - R2 implementácia zhrnutie
- **r2-quick-guide.md** - R2 quick guide
- **R2-SSL-FIX.md** - R2 SSL fix
- **RUN-TEST.md** - Run test
- **TEST-PDF-GENERATORS.md** - Test PDF generators

---

### [Playbooks](./playbooks/)
Systematické playbooks pre opakujúce sa úlohy.

- **add-field-e2e.md** - End-to-end pridanie fieldu
- **invariants-system.md** - Invariants systém

---

### [Diagnostics](./diagnostics/)
Diagnostické nástroje a guides.

- **DIAGNOSTICS-GUIDE.md** - Kompletný diagnostics guide

---

### [Summary](./summary/)
Zhrnutia implementácií, zmien a progress reportov.

- **Web Summaries** - Frontend/backend summaries
- **Mobile Summaries** - Mobile app summaries
- **Batch Operations** - Batch form changes
- **Analysis Reports** - Bundle analysis, cleanup summaries

### [Archive](./archive/)
Staré a nepoužívané dokumenty.

---

## 🚀 Rýchle Odkazy

### Pre nových vývojárov:
1. [Quick Start](./01-getting-started/QUICK-START.md)
2. [Project Setup](./01-getting-started/PROJECT_SETUP_GUIDE.md)
3. [Development Workflow](./setup/DEVELOPMENT-WORKFLOW.md)

### Pre deployment:
1. [Deployment Guide](./deployment/DEPLOYMENT-GUIDE.md)
2. [Railway Deploy](./deployment/RAILWAY-DEPLOY.md)
3. [Production Checklist](./deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

### Pre debugging:
1. [Diagnostics Guide](./diagnostics/DIAGNOSTICS-GUIDE.md)
2. [Database Access](./database/database-access-guide.md)
3. [Quick Diagnostics](./07-testing/QUICK-DIAGNOSTICS.md)

---

## 📝 Konvencie

- Používame **Conventional Commits** formát
- TypeScript strict mode vždy zapnutý
- Žiadne errors ani warnings v produkcii
- TDD prístup kde je to možné

---

## 🔧 Užitočné Príkazy

```bash
# Development
npm run dev:start    # Spustiť aplikáciu
npm run dev:stop     # Zastaviť aplikáciu
npm run dev:restart  # Reštartovať aplikáciu

# Testing
npm run test         # Spustiť testy
npm run test:ui      # Test UI

# Diagnostics
npm run health       # Health check
npm run fix          # Auto-fix problémov
npm run diagnose     # Interaktívna diagnostika

# Build
npm run build        # Build frontend
cd backend && npm run build  # Build backend
```

---

## 📞 Podpora

Pre otázky a problémy:
- Skontroluj [Diagnostics Guide](./diagnostics/DIAGNOSTICS-GUIDE.md)
- Pozri [Fixes & Bugs](./08-fixes-and-bugs/) sekciu
- Spusti `npm run diagnose` pre interaktívnu diagnostiku

---

**Posledná aktualizácia:** 2025-01-09
**Verzia dokumentácie:** 2.0

