#!/bin/bash

# 🧹 MASS CONSOLE.LOG CLEANUP SCRIPT
# Nahradí všetky console.logs za smartLogger v celom projekte

set -e

echo "🧹 Starting mass console.log cleanup..."
echo ""

# Navigate to src directory
SRC_DIR="$(dirname "$0")/../src"
cd "$SRC_DIR" || exit 1

# Backup count
BEFORE=$(grep -r "console\.log\|console\.debug\|console\.info" . --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
echo "📊 Found $BEFORE console.log/debug/info statements before cleanup"
echo ""

# Files to skip completely
SKIP_FILES=(
  "./utils/smartLogger.ts"
  "./utils/logger.ts"
  "./setupTests.ts"
)

# Create skip pattern for grep
SKIP_PATTERN=""
for file in "${SKIP_FILES[@]}"; do
  SKIP_PATTERN="$SKIP_PATTERN ! -path '$file'"
done

echo "🔄 Phase 1: Adding logger imports..."
# Add logger import to files that use console.log but don't have it yet
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/utils/smartLogger.ts" \
  ! -path "*/utils/logger.ts" \
  -exec grep -l "console\.\(log\|debug\|info\)" {} \; | while read -r file; do
    # Check if file already has logger import
    if ! grep -q "from.*smartLogger" "$file" && ! grep -q "from.*logger" "$file"; then
      # Add import after the last import statement
      if grep -q "^import" "$file"; then
        # Find the last import line
        LAST_IMPORT_LINE=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        # Insert logger import after last import
        sed -i "" "${LAST_IMPORT_LINE}a\\
import { logger } from '@/utils/smartLogger';
" "$file"
        echo "  ✅ Added logger import to: $file"
      fi
    fi
done

echo ""
echo "🔄 Phase 2: Replacing console.log statements..."

# Replace console.log with logger.debug
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/utils/smartLogger.ts" \
  ! -path "*/utils/logger.ts" \
  ! -path "*/setupTests.ts" \
  -exec sed -i "" \
    -e 's/console\.log(/logger.debug(/g' \
    -e 's/console\.debug(/logger.debug(/g' \
    -e 's/console\.info(/logger.info(/g' \
    {} +

echo "  ✅ Replaced console.log → logger.debug"
echo "  ✅ Replaced console.debug → logger.debug"
echo "  ✅ Replaced console.info → logger.info"

# Count after
AFTER=$(grep -r "console\.log\|console\.debug\|console\.info" . --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | xargs)
REMOVED=$((BEFORE - AFTER))

echo ""
echo "📊 RESULTS:"
echo "  Before:  $BEFORE console statements"
echo "  After:   $AFTER console statements"
echo "  Removed: $REMOVED statements (-$(awk "BEGIN {printf \"%.1f\", ($REMOVED/$BEFORE)*100}")%)"
echo ""

# Show remaining console statements
if [ "$AFTER" -gt 0 ]; then
  echo "⚠️  Remaining console statements (should be in logger.ts or errors only):"
  grep -r "console\." . --include="*.ts" --include="*.tsx" | head -10
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test build: pnpm build"
echo "  3. Commit: git add . && git commit -m 'chore: replace console.logs with smartLogger'"

