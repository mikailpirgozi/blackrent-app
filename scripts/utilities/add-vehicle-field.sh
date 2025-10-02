#!/bin/bash

# 🚀 AUTOMATIZOVANÝ SCRIPT PRE PRIDÁVANIE POLÍ K VOZIDLÁM
# Usage: ./add-vehicle-field.sh fieldName [type] [label]

FIELD_NAME=$1
FIELD_TYPE=${2:-"string"}
FIELD_LABEL=${3:-$FIELD_NAME}
DB_COLUMN=${FIELD_NAME/([A-Z])/_\1}
DB_COLUMN=$(echo "$DB_COLUMN" | tr '[:upper:]' '[:lower:]')

if [ -z "$FIELD_NAME" ]; then
  echo "❌ Usage: ./add-vehicle-field.sh fieldName [type] [label]"
  echo "📝 Examples:"
  echo "   ./add-vehicle-field.sh seatsCount number 'Počet sedadiel'"
  echo "   ./add-vehicle-field.sh enginePower number 'Výkon motora'"
  echo "   ./add-vehicle-field.sh color string 'Farba vozidla'"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🚀 BlackRent Field Addition System               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "📝 Field: $FIELD_NAME ($FIELD_TYPE) - $FIELD_LABEL"
echo "🗄️ DB Column: $DB_COLUMN"
echo ""

# Backup files
echo "💾 Creating backups..."
cp backend/src/types/index.ts backend/src/types/index.ts.backup
cp src/types/index.ts src/types/index.ts.backup
cp src/components/vehicles/VehicleForm.tsx src/components/vehicles/VehicleForm.tsx.backup

echo "✅ Backups created"

# 1. Backend types
echo "🔧 1. Adding to backend types..."
if grep -q "$FIELD_NAME" backend/src/types/index.ts; then
  echo "⚠️  Field already exists in backend types"
else
  sed -i '' "/stk?: Date;/a\\
  $FIELD_NAME?: $FIELD_TYPE; // 🆕 $FIELD_LABEL" backend/src/types/index.ts
  echo "✅ Backend types updated"
fi

# 2. Frontend types
echo "🎨 2. Adding to frontend types..."
if grep -q "$FIELD_NAME" src/types/index.ts; then
  echo "⚠️  Field already exists in frontend types"
else
  sed -i '' "/imageUrl?: string;/a\\
  $FIELD_NAME?: $FIELD_TYPE; // 🆕 $FIELD_LABEL" src/types/index.ts
  echo "✅ Frontend types updated"
fi

# 3. Generate form field template
echo "📝 3. Generating form field template..."
FORM_TEMPLATE=""
if [ "$FIELD_TYPE" = "number" ]; then
  FORM_TEMPLATE="        <TextField
          fullWidth
          label=\"$FIELD_LABEL\"
          type=\"number\"
          value={formData.$FIELD_NAME || ''}
          onChange={(e) => handleInputChange('$FIELD_NAME', parseInt(e.target.value) || null)}
          placeholder=\"Zadajte $FIELD_LABEL\"
        />"
else
  FORM_TEMPLATE="        <TextField
          fullWidth
          label=\"$FIELD_LABEL\"
          value={formData.$FIELD_NAME || ''}
          onChange={(e) => handleInputChange('$FIELD_NAME', e.target.value)}
          placeholder=\"Zadajte $FIELD_LABEL\"
        />"
fi

echo "📋 Form field template generated"

# 4. Generate handleSubmit addition
HANDLE_SUBMIT_LINE="      $FIELD_NAME: formData.$FIELD_NAME || null, // 🆕 $FIELD_LABEL"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    📋 MANUAL STEPS                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "🔧 4. ADD TO VEHICLE FORM:"
echo "   File: src/components/vehicles/VehicleForm.tsx"
echo "   Location: After VIN field (around line 248)"
echo ""
echo "$FORM_TEMPLATE"
echo ""
echo "🔧 5. ADD TO HANDLE SUBMIT:"
echo "   File: src/components/vehicles/VehicleForm.tsx"  
echo "   Location: In completeVehicle object (around line 111)"
echo ""
echo "$HANDLE_SUBMIT_LINE"
echo ""
echo "🔧 6. ADD TO BACKEND API:"
echo "   File: backend/src/routes/vehicles.ts"
echo "   A. POST endpoint destructuring (line ~228):"
echo "      const { ..., $FIELD_NAME } = req.body;"
echo ""
echo "   B. PUT endpoint destructuring (line ~273):"
echo "      const { ..., $FIELD_NAME } = req.body;"
echo ""
echo "   C. updatedVehicle object (line ~289):"
echo "      $FIELD_NAME: $FIELD_NAME !== undefined ? $FIELD_NAME : existingVehicle.$FIELD_NAME,"
echo ""
echo "🔧 7. ADD TO DATABASE METHODS:"
echo "   File: backend/src/models/postgres-database.ts"
echo "   A. createVehicle interface (line ~2272)"
echo "   B. createVehicle SQL INSERT (line ~2312)"
echo "   C. createVehicle return (line ~2340)"
echo "   D. updateVehicle SQL UPDATE (line ~2374)"
echo "   E. getVehiclesFresh mapping (line ~2182)"
echo "   F. getVehicle mapping (line ~2257)"
echo ""
echo "🔧 8. ADD TO SEARCH:"
echo "   File: src/context/AppContext.tsx (line ~452)"
echo "   File: src/utils/rentalFilters.ts (line ~66)"
echo ""
echo "🔧 9. ADD TO DISPLAY:"
echo "   File: src/components/vehicles/VehicleListNew.tsx"
echo "   Add column and display logic"
echo ""
echo "🧪 10. TEST:"
echo "    npm run build && npm run dev:restart"
echo "    Test create/update/display/search"
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      🎯 NEXT STEPS                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "1. Follow manual steps above"
echo "2. Run: npm run build"
echo "3. Run: npm run dev:restart"
echo "4. Test the new field"
echo ""
echo "💡 TIP: Copy-paste the generated templates to save time!"
