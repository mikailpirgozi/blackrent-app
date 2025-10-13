# 🚀 Performance Testing: Express vs Fastify

## 📋 Príprava

### 1. Nainštaluj autocannon (pre load testing)

```bash
npm install -g autocannon
```

### 2. Získaj test token

```bash
# Prihlás sa do aplikácie a skopíruj JWT token z:
# - Developer Tools → Application → Local Storage → token
# - Alebo z Network tab → Headers → Authorization

export TEST_TOKEN="tvoj-jwt-token-tu"
```

---

## 🧪 Testovanie

### Variant A: Response Time Comparison (Rýchly test - 2 minúty)

**Čo testuje:** Rýchlosť odozvy jednotlivých endpointov

```bash
cd backend

# Spusti Express server (v prvom termináli)
npm run dev

# Spusti Fastify server (v druhom termináli)
# (Musíš dočasne zmeniť port v server.ts na 3001 alebo spustiť fastify-app priamo)
PORT=3001 tsx src/fastify-app.ts

# V treťom termináli spusti comparison
export TEST_TOKEN="tvoj-token"
npm run test:performance
```

**Očakávaný output:**
```
🚀 Starting Performance Comparison...

📊 Testing: /debug/test-connection
  Express: 45ms
  Fastify: 28ms
  ⚡ Fastify je 37.8% rýchlejší

📊 Testing: /vehicles
  Express: 152ms
  Fastify: 89ms
  ⚡ Fastify je 41.4% rýchlejší

...

📊 SUMMARY REPORT
📈 Average Response Times:
  Express:  124.35ms
  Fastify:  73.21ms
  Speedup:  41.1%
```

---

### Variant B: Load Testing (Plný test - 5 minút)

**Čo testuje:** Výkon pri vysokej záťaži (100 súčasných connectionov, 30s)

```bash
cd backend

# Spusti Express server (v prvom termináli)
npm run dev

# Spusti Fastify server (v druhom termináli)
PORT=3001 tsx src/fastify-app.ts

# V treťom termináli spusti load test
export TEST_TOKEN="tvoj-token"
npm run test:load
```

**Očakávaný output:**
```
🚀 Load Testing: Express vs Fastify

Configuration:
  Connections: 100
  Duration: 30s
  Token: ✅ Set

========================================
Testing: /api/vehicles
========================================

Testing Express: /api/vehicles
Results:
  Req/Sec: 1234
  Latency: 78ms

Testing Fastify: /api/vehicles
Results:
  Req/Sec: 2156
  Latency: 44ms

...

📊 COMPARISON SUMMARY
/api/vehicles
  Express: 1234 req/s, 78ms latency
  Fastify: 2156 req/s, 44ms latency

✅ Load testing complete!
📄 Full report saved to: ./performance-results/comparison_report_20250113_143045.md
```

---

## 📊 Výsledky

### Performance Metrics

**Response Time Comparison:**
- ⚡ Latency: Fastify 30-50% rýchlejší
- 📈 Throughput: Fastify 40-60% viac requestov/sekundu
- 💾 Memory: Fastify ~20-30% nižšia spotreba

**Load Testing:**
- 🚀 Concurrent connections: Fastify zvládne 50-100% viac
- ⏱️ Response time under load: Fastify stabilnejší
- 📉 Error rate: Oba servery by mali mať 0% errors

---

## 🔧 Troubleshooting

### Problém: "Cannot connect to Express/Fastify"

**Riešenie:**
```bash
# Skontroluj že oba servery bežia
lsof -i :3000  # Express
lsof -i :3001  # Fastify

# Alebo
curl http://localhost:3000/api/debug/test-connection
curl http://localhost:3001/api/debug/test-connection
```

### Problém: "401 Unauthorized"

**Riešenie:**
```bash
# Token je neplatný alebo expirovaný
# Získaj nový token z aplikácie a nastav:
export TEST_TOKEN="novy-token"
```

### Problém: "autocannon: command not found"

**Riešenie:**
```bash
npm install -g autocannon
# Alebo použite npx
npx autocannon -c 100 -d 30 http://localhost:3000/api/vehicles
```

---

## 🎯 Doporučené Ďalšie Kroky

### Po performance testingu:

1. **Ak Fastify > 30% rýchlejší:**
   - ✅ Prepni na Fastify v produkcii
   - ✅ Monitoruj prvých 24h
   - ✅ Odstráň Express po 1 týždni

2. **Ak Fastify < 30% rýchlejší:**
   - 🔍 Analyzuj kde je bottleneck
   - 🔧 Optimalizuj queries/logiku
   - 🧪 Zopakuj testy

3. **Ak sú výsledky podobné:**
   - 🤔 Bottleneck nie je v frameworku (DB, network, logic)
   - 🔍 Profiling databázových queries
   - 📊 Monitoring production trafficu

---

## 📈 Expected Results (Baseline)

Pre BlackRent aplikáciu očakávame:

**Development (localhost, SQLite/PostgreSQL local):**
- Express: ~100-200ms average
- Fastify: ~60-120ms average
- **Speedup: 35-45%**

**Production (Railway, PostgreSQL remote):**
- Express: ~150-300ms average
- Fastify: ~90-180ms average
- **Speedup: 35-45%**

**Load Testing (100 connections):**
- Express: ~800-1200 req/s
- Fastify: ~1400-2000 req/s
- **Throughput: +50-70%**

---

## ✅ Checklist

- [ ] Autocannon nainštalovaný
- [ ] Test token získaný
- [ ] Express server beží na :3000
- [ ] Fastify server beží na :3001
- [ ] Response time test vykonaný
- [ ] Load test vykonaný
- [ ] Výsledky analyzované
- [ ] Report vytvorený
- [ ] Rozhodnutie o deployi

---

## 🚨 Poznámky

- **Čas testovania:** ~10-15 minút celkovo
- **CPU usage:** Počas load testov očakávaj 80-100% CPU
- **Memory:** Sleduj memory usage oboch serverov
- **Database:** Testy zaťažia DB, používaj DEV environment!

---

**Pripravené pre:** BlackRent Beta 2  
**Dátum:** 2025-01-13  
**Verzia:** 1.0


