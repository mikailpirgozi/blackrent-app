#!/bin/bash

# List of files with Button/Badge errors
FILES=(
  "src/components/vehicles/VehicleForm.tsx"
  "src/components/vehicles/VehicleListNew.tsx"
  "src/components/vehicles/VehicleCardLazy.tsx"
  "src/components/vehicles/VehicleImage.tsx"
  "src/components/vehicles/TechnicalCertificateUpload.tsx"
  "src/pages/AvailabilityPageNew.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Replace Button import from shadcn with UnifiedButton
    sed -i '' 's/import { Button } from/import { UnifiedButton as Button } from/g' "$file"
    sed -i '' "s|from '@/components/ui/button'|from '@/components/ui/UnifiedButton'|g" "$file"
    sed -i '' "s|from '.*components/ui/button'|from '@/components/ui/UnifiedButton'|g" "$file"
    
    # Replace Badge import from shadcn with UnifiedBadge  
    sed -i '' 's/import { Badge } from/import { UnifiedBadge as Badge } from/g' "$file"
    sed -i '' "s|from '@/components/ui/badge'|from '@/components/ui/UnifiedBadge'|g" "$file"
    sed -i '' "s|from '.*components/ui/badge'|from '@/components/ui/UnifiedBadge'|g" "$file"
    
    echo "  ✅ Updated $file"
  fi
done

echo "✅ All files updated to use Unified components"
