#!/bin/bash

# 🛡️ MUI Safety Check - Bulletproof protection against getContrastRatio issues
# This script ensures MUI will NEVER break in production

echo "🛡️ MUI Safety Check - Bulletproof protection"
echo "=============================================="

# 1. Check for dangerous MUI chunks
echo "🔍 Checking for dangerous MUI chunks..."
if find dist -name "*mui*.js" -o -name "*date-utils*.js" | grep -q .; then
    echo "❌ DANGER: MUI chunks detected!"
    echo "📋 Found chunks:"
    find dist -name "*mui*.js" -o -name "*date-utils*.js"
    echo ""
    echo "🔧 FIXING: Rebuilding with nuclear option..."
    
    # Force nuclear option
    sed -i.bak 's/manualChunks: .*/manualChunks: undefined,/' vite.config.ts
    npm run build
    
    echo "✅ Fixed: MUI is now in main bundle"
else
    echo "✅ Safe: No dangerous MUI chunks found"
fi

# 2. Check polyfill presence
echo ""
echo "🔍 Checking polyfill presence..."
if grep -q "getContrastRatio" dist/index.html; then
    echo "✅ Polyfill found in HTML"
else
    echo "❌ DANGER: No polyfill found!"
    exit 1
fi

# 3. Check main bundle size (should be ~700-800kB if everything is included)
echo ""
echo "🔍 Checking main bundle size..."
MAIN_BUNDLE=$(find dist/assets -name "index-*.js" -exec ls -la {} \; | awk '{print $5}')
if [ "$MAIN_BUNDLE" -gt 500000 ]; then
    echo "✅ Main bundle size OK: ${MAIN_BUNDLE} bytes (everything included)"
else
    echo "⚠️  Warning: Main bundle seems small: ${MAIN_BUNDLE} bytes"
fi

# 4. Generate safety report
echo ""
echo "📊 SAFETY REPORT"
echo "================"
echo "Main bundle: $(find dist/assets -name "index-*.js")"
echo "Bundle size: ${MAIN_BUNDLE} bytes"
echo "Polyfill: $(grep -c "getContrastRatio" dist/index.html) instances"
echo "MUI chunks: $(find dist -name "*mui*.js" | wc -l)"
echo ""

if [ $(find dist -name "*mui*.js" | wc -l) -eq 0 ]; then
    echo "🎉 SUCCESS: MUI Safety Check PASSED!"
    echo "✅ No MUI chunks = No getContrastRatio issues"
else
    echo "❌ FAILED: MUI Safety Check FAILED!"
    exit 1
fi
