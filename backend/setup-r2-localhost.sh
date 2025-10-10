#!/bin/bash

# 🔧 R2 Setup Script pre Localhost
# Automaticky stiahne R2 credentials z Railway a vytvorí .env

echo "🚀 R2 Setup Script pre Localhost"
echo "=================================="
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nie je nainštalované!"
    echo ""
    echo "📥 Inštaluj Railway CLI:"
    echo "npm install -g @railway/cli"
    echo "# alebo"
    echo "brew install railway"
    echo ""
    echo "Potom spusti tento script znova."
    exit 1
fi

echo "✅ Railway CLI nájdené"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Nie si prihlásený do Railway!"
    echo ""
    echo "🔐 Prihlás sa:"
    echo "railway login"
    echo ""
    echo "Potom spusti tento script znova."
    exit 1
fi

echo "✅ Prihlásený do Railway"
echo ""

# Link to project (if not linked)
if [ ! -f "railway.json" ]; then
    echo "🔗 Linking Railway project..."
    railway link
fi

echo "📥 Sťahujem R2 credentials z Railway..."
echo ""

# Get environment variables from Railway
R2_ENDPOINT=$(railway variables get R2_ENDPOINT 2>/dev/null)
R2_ACCESS_KEY_ID=$(railway variables get R2_ACCESS_KEY_ID 2>/dev/null)
R2_SECRET_ACCESS_KEY=$(railway variables get R2_SECRET_ACCESS_KEY 2>/dev/null)
R2_BUCKET_NAME=$(railway variables get R2_BUCKET_NAME 2>/dev/null)
R2_ACCOUNT_ID=$(railway variables get R2_ACCOUNT_ID 2>/dev/null)
R2_PUBLIC_URL=$(railway variables get R2_PUBLIC_URL 2>/dev/null)

# Check if variables exist
if [ -z "$R2_ACCESS_KEY_ID" ]; then
    echo "❌ R2 credentials nenájdené na Railway!"
    echo ""
    echo "🔍 Skontroluj Railway dashboard:"
    echo "1. Otvor Railway dashboard"
    echo "2. Vyber backend service"
    echo "3. Variables tab"
    echo "4. Over že existujú R2_* variables"
    echo ""
    exit 1
fi

echo "✅ R2 credentials nájdené na Railway!"
echo ""

# Create .env file
echo "📝 Vytváram .env súbor..."

cat > .env << EOF
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

# JWT Secret
JWT_SECRET=blackrent-super-secret-jwt-key-2024

# Server Configuration
PORT=3001
NODE_ENV=development

# Sentry Error Tracking (optional)
SENTRY_DSN_BACKEND=
VERSION=1.0.0

# IMAP Email Monitoring Configuration
IMAP_HOST=imap.m1.websupport.sk
IMAP_PORT=993
IMAP_USER=info@blackrent.sk
IMAP_PASSWORD=
IMAP_ENABLED=false
IMAP_AUTO_START=false

# SMTP Email Sending Configuration
SMTP_HOST=smtp.m1.websupport.sk
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@blackrent.sk
SMTP_PASS=
SMTP_FROM_NAME=BlackRent System
EMAIL_SEND_PROTOCOLS=false

# Cloudflare R2 Storage Configuration (FROM RAILWAY)
R2_ENDPOINT=${R2_ENDPOINT}
R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
R2_BUCKET_NAME=${R2_BUCKET_NAME}
R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
R2_PUBLIC_URL=${R2_PUBLIC_URL}

# Optional
RUN_MIGRATIONS=false
EOF

echo "✅ .env súbor vytvorený!"
echo ""
echo "📋 R2 Configuration:"
echo "  Endpoint: ${R2_ENDPOINT}"
echo "  Bucket: ${R2_BUCKET_NAME}"
echo "  Account ID: ${R2_ACCOUNT_ID}"
echo "  Public URL: ${R2_PUBLIC_URL}"
echo ""
echo "🔐 Credentials:"
echo "  Access Key ID: ${R2_ACCESS_KEY_ID:0:20}..."
echo "  Secret Key: ${R2_SECRET_ACCESS_KEY:0:20}..."
echo ""
echo "✅ HOTOVO! Teraz restart backend server:"
echo ""
echo "npm run dev"
echo "# alebo"
echo "pnpm run dev"
echo ""

