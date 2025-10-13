# 🚀 LOCALHOST QUICK START

## ✅ SETUP COMPLETE!

Tvoj localhost má teraz nakonfigurované:
- ✅ **R2 Storage** - upload súborov do cloudu
- ✅ **Email SMTP** - odosielanie protokolov
- ✅ **Email IMAP** - prijímanie objednávok
- ✅ **PDF Generation** - custom font Aeonik
- ✅ **Sentry** - error tracking

---

## 🏃 START

```bash
# 1. Backend
cd backend
pnpm run dev

# 2. Frontend (v novom terminále)
cd ..
pnpm run dev
```

---

## ✅ VERIFY

Otvor browser console pri štarte backendu a hľadaj:

```
✅ R2 Storage initialized successfully
✅ Bucket: blackrent-storage
📧 EMAIL: Service inicializovaný pre info@blackrent.sk
```

---

## 🧪 TESTY

### 1. Test R2 Upload
```bash
# Frontend
http://localhost:3000/test-protocols

# Alebo API
curl -X POST http://localhost:3001/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
```

### 2. Test Email SMTP
```bash
curl http://localhost:3001/api/protocols/debug/test-email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Email IMAP
```bash
curl http://localhost:3001/api/email-imap/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ DÔLEŽITÉ

**Používaš PRODUCTION credentials!**
- R2 zapisuje do **skutočného** bucketu
- SMTP odosiela **skutočné** emaily
- IMAP číta **skutočné** emaily z info@blackrent.sk

**Buď opatrný pri testovaní!**

---

## 🔍 TROUBLESHOOTING

### Backend nenaštartuje?
```bash
# Check .env
ls -la backend/.env

# View .env
cat backend/.env | grep -E "^(R2_|SMTP_|IMAP_)"
```

### R2 upload nefunguje?
```bash
# Check R2 config
grep "R2_" backend/.env

# Restart backend
cd backend && pnpm run dev
```

### Email nefunguje?
```bash
# Check SMTP/IMAP
grep -E "SMTP_|IMAP_" backend/.env
```

---

## 📖 FULL DOCS

Detailnú dokumentáciu nájdeš v:
```
LOCALHOST-ENV-COMPLETE.md
```

---

**Ready to go! 🚀**
