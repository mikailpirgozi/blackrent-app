#!/bin/bash

# Fix TypeScript router type inference errors in backend routes
# Adds explicit ': Router' type annotation to router constants

echo "🔧 Fixing router type annotations in backend/src/routes/*.ts"

cd "$(dirname "$0")/.."

# Find all route files and add explicit Router type
find backend/src/routes -name "*.ts" -type f | while read -r file; do
  echo "Processing: $file"
  
  # Check if file has 'const router = Router()' without type annotation
  if grep -q "^const router = Router();" "$file"; then
    # Add explicit type annotation
    sed -i '' 's/^const router = Router();/const router: Router = Router();/' "$file"
    echo "  ✅ Fixed: Added explicit Router type"
  elif grep -q "^export const router = Router();" "$file"; then
    # Fix export const router pattern
    sed -i '' 's/^export const router = Router();/export const router: Router = Router();/' "$file"
    echo "  ✅ Fixed: Added explicit Router type (export)"
  else
    echo "  ⏭️  Skipped: Already has type or different pattern"
  fi
done

echo ""
echo "✅ Done! All router exports now have explicit types"
echo ""
echo "Run 'cd backend && pnpm run build' to verify"

