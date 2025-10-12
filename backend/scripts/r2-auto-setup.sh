#!/bin/bash
# Auto-setup R2 CLI credentials from existing env

set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_VARS="$BACKEND_DIR/.dev.vars"

echo "🔧 R2 CLI Auto-Setup"

# Check if .env exists
if [ -f "$BACKEND_DIR/.env" ]; then
  echo "✅ Found .env, loading credentials..."
  source "$BACKEND_DIR/.env"
fi

# Check if credentials are set
if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ]; then
  echo "❌ R2 credentials not found in environment!"
  echo ""
  echo "Please set these in .env or export them:"
  echo "  export R2_ACCOUNT_ID=your-account-id"
  echo "  export R2_ACCESS_KEY_ID=your-access-key"
  echo "  export R2_SECRET_ACCESS_KEY=your-secret-key"
  echo "  export R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com"
  echo "  export R2_BUCKET_NAME=blackrent"
  exit 1
fi

# Write to .dev.vars
cat > "$DEV_VARS" << EOF
# Auto-generated R2 credentials - $(date)
CLOUDFLARE_ACCOUNT_ID=$R2_ACCOUNT_ID
R2_ACCOUNT_ID=$R2_ACCOUNT_ID
R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
R2_ENDPOINT=$R2_ENDPOINT
R2_BUCKET_NAME=${R2_BUCKET_NAME:-blackrent}
EOF

echo "✅ Created .dev.vars with R2 credentials"
echo ""
echo "🧪 Testing connection..."

# Source it
source "$DEV_VARS"

# Test using ts-node with env vars
cd "$BACKEND_DIR"
R2_ACCOUNT_ID=$R2_ACCOUNT_ID \
R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID \
R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY \
R2_ENDPOINT=$R2_ENDPOINT \
R2_BUCKET_NAME=${R2_BUCKET_NAME:-blackrent} \
pnpm ts-node scripts/r2-advanced.ts test

echo ""
echo "✅ R2 CLI is ready!"
echo ""
echo "Available commands:"
echo "  pnpm r2:test     - Test connection"
echo "  pnpm r2:analyze  - Storage stats"
echo "  pnpm r2:list     - List files"

