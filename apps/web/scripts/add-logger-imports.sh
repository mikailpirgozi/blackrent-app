#!/bin/bash
cd "$(dirname "$0")/../src" || exit 1

# Find all files that use logger but don't have the import
find . -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/utils/smartLogger.ts" \
  ! -path "*/utils/logger.ts" \
  -exec grep -l "logger\." {} \; | while read -r file; do
    
    # Check if file already has logger import
    if ! grep -q "from.*smartLogger\|from.*logger" "$file"; then
      # Find the last import line
      LAST_IMPORT=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
      
      if [ -n "$LAST_IMPORT" ]; then
        # Insert logger import after last import
        sed -i '' "${LAST_IMPORT}a\\
import { logger } from '@/utils/smartLogger';
" "$file"
        echo "✅ Added logger import to: $file"
      fi
    fi
done

echo "✅ Done! Logger imports added."
