#!/bin/bash

echo "🔧 Fixing duplicate className attributes..."

# Súbory s duplicate className errors
FILES=(
  "src/components/insurances/VehicleCentricInsuranceList.tsx"
  "src/components/rentals/RentalList.tsx"
  "src/components/settlements/SettlementDetail.tsx"
  "src/components/vehicles/VehicleImage.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Processing $file..."
    
    # Použijeme perl pre multiline matching a merge duplicitných className
    perl -i -0pe 's/className="([^"]+)"\s+([^>]*?)\s+className="([^"]+)"/className="$1 $3" $2/gs' "$file"
    
    echo "✅ Fixed $file"
  fi
done

echo ""
echo "✅ All duplicates fixed!"
echo "Run: pnpm run typecheck to verify"

