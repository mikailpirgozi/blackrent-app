#!/bin/bash

# 🎯 BlackRent Staging Environment Setup
# Run this script interactively to set up staging environment variables

set -e

echo "🚀 Setting up BlackRent Staging Environment Variables"
echo "======================================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Install: curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

echo "✅ Railway CLI found"
echo ""

# Link to staging service (interactive)
echo "📋 Step 1: Link to staging service"
echo "Select: blackrent-app → blackrent-staging"
railway link

echo ""
echo "📋 Step 2: Setting staging environment variables..."
echo ""

# Set staging-specific variables
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "NODE_ENV=staging" \
  --set "RAILWAY_ENVIRONMENT=staging" \
  --set "R2_STAGING_PREFIX=staging/" \
  --set "STAGING_EMAIL_PREFIX=[STAGING TEST]" \
  --set "FRONTEND_URL=https://blackrent-staging.vercel.app" \
  --set "FORCE_LOCAL_STORAGE=false"

echo ""
echo "📋 Step 3: Copying production variables to staging..."
echo ""

# Core variables (same as production)
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "PORT=8080" \
  --set "JWT_SECRET=blackrent-super-secret-jwt-key-2024" \
  --set "REACT_APP_VERSION=1.0.0-staging" \
  --set "VERSION=1.0.0-staging"

# R2 Configuration (same bucket, staging prefix)
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "R2_ENDPOINT=https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com" \
  --set "R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8" \
  --set "R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69" \
  --set "R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53" \
  --set "R2_BUCKET_NAME=blackrent-storage" \
  --set "R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev"

# Email Configuration (same SMTP, staging prefix)
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "SMTP_HOST=smtp.m1.websupport.sk" \
  --set "SMTP_PORT=465" \
  --set "SMTP_SECURE=true" \
  --set "SMTP_USER=info@blackrent.sk" \
  --set "SMTP_PASS=Hesloheslo11" \
  --set "SMTP_FROM_NAME=BlackRent Staging" \
  --set "EMAIL_FROM=info@blackrent.sk" \
  --set "EMAIL_SEND_PROTOCOLS=true"

# IMAP Configuration (disabled for staging to not interfere)
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "IMAP_ENABLED=false" \
  --set "IMAP_AUTO_START=false" \
  --set "IMAP_HOST=imap.m1.websupport.sk" \
  --set "IMAP_PORT=993" \
  --set "IMAP_USER=info@blackrent.sk" \
  --set "IMAP_PASSWORD=Hesloheslo11"

# PDF & Features
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "PDF_GENERATOR_TYPE=custom-font" \
  --set "CUSTOM_FONT_NAME=aeonik" \
  --set "PROTOCOL_V2_ENABLED=false" \
  --set "PROTOCOL_V2_PERCENTAGE=0"

# Sentry (optional - use different DSN for staging)
railway variables \
  --environment production \
  --service blackrent-staging \
  --set "SENTRY_DSN_BACKEND=https://e662e41f89d59c7fbc21af1b941fef51@o4509695990431744.ingest.de.sentry.io/4509696032309328"

echo ""
echo "⚠️  IMPORTANT: DATABASE_URL"
echo "You need to set DATABASE_URL manually!"
echo ""
echo "Option 1 - Separate staging DB (RECOMMENDED):"
echo "  1. Add PostgreSQL plugin in Railway dashboard"
echo "  2. Name it: blackrent-staging-db"
echo "  3. Copy DATABASE_URL and run:"
echo "     railway variables --service blackrent-staging --set \"DATABASE_URL=<your-staging-db-url>\""
echo ""
echo "Option 2 - Share production DB (NOT RECOMMENDED):"
echo "  railway variables --service blackrent-staging --set \"DATABASE_URL=postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@postgres.railway.internal:5432/railway\""
echo ""
echo "✅ Staging environment variables set!"
echo ""
echo "📋 Next steps:"
echo "1. Set DATABASE_URL (see above)"
echo "2. Deploy: git push origin staging"
echo "3. Test: https://blackrent-staging.up.railway.app/health"

