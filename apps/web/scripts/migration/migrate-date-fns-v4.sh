#!/bin/bash

echo "🔄 Migrating date-fns v2 → v4..."
echo ""

# 1. Fix locale imports
echo "📝 Fixing locale imports..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/import sk from 'date-fns\/locale\/sk'/import { sk } from 'date-fns\/locale'/g" \
  -e "s/import \* as sk from 'date-fns\/locale\/sk'/import { sk } from 'date-fns\/locale'/g" \
  {} +

# 2. Fix format tokens in strings
echo "📝 Fixing format tokens..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/'DD\.MM\.YYYY'/'dd.MM.yyyy'/g" \
  -e "s/'DD\. MM\. YYYY'/'dd. MM. yyyy'/g" \
  -e "s/'YYYY-MM-DD'/'yyyy-MM-dd'/g" \
  -e "s/'DD\/MM\/YYYY'/'dd\/MM\/yyyy'/g" \
  -e "s/\"DD\.MM\.YYYY\"/\"dd.MM.yyyy\"/g" \
  -e "s/\"DD\. MM\. YYYY\"/\"dd. MM. yyyy\"/g" \
  -e "s/\"YYYY-MM-DD\"/\"yyyy-MM-dd\"/g" \
  -e "s/\"DD\/MM\/YYYY\"/\"dd\/MM\/yyyy\"/g" \
  -e "s/'DD\.MM\.YYYY HH:mm'/'dd.MM.yyyy HH:mm'/g" \
  -e "s/\"DD\.MM\.YYYY HH:mm\"/\"dd.MM.yyyy HH:mm\"/g" \
  {} +

echo ""
echo "✅ Automated migration complete!"
echo ""
echo "⚠️  Manual review needed for:"
echo "   - src/components/ui/UnifiedDatePicker.tsx"
echo "   - src/utils/dateUtils.ts"
echo "   - src/utils/formatters.ts"
echo ""
echo "Run: pnpm run typecheck && pnpm run build"

