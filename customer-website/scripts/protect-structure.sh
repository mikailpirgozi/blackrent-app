#!/bin/bash

# 🛡️ BLACKRENT STRUCTURE PROTECTION SCRIPT
# Tento script kontroluje, či sa nevrátili nežiaduce komponenty

echo "🔍 Kontrolujem štruktúru BlackRent customer website..."

# Kontrola page.tsx
PAGE_FILE="src/app/page.tsx"
ERRORS=0

echo "📄 Kontrolujem $PAGE_FILE..."

# Kontrola nežiaducich importov
if grep -q "import.*HeroSection" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený HeroSection import (Tesla banner)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "import.*BrandLogosSection" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený BrandLogosSection import (duplicitné logá)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "import.*ChatButton" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený ChatButton import (chat tlačidlo)"
    ERRORS=$((ERRORS + 1))
fi

# Kontrola nežiaducich komponentov v JSX
if grep -q "<HeroSection" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený <HeroSection> komponent (Tesla banner)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "<BrandLogosSection" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený <BrandLogosSection> komponent (duplicitné logá)"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "<ChatButton" "$PAGE_FILE"; then
    echo "❌ CHYBA: Nájdený <ChatButton> komponent (chat tlačidlo)"
    ERRORS=$((ERRORS + 1))
fi

# Kontrola správnych importov
if ! grep -q "import.*HeaderSection" "$PAGE_FILE"; then
    echo "⚠️  VAROVANIE: Chýba HeaderSection import"
fi

if ! grep -q "import.*FeaturedItemsSection" "$PAGE_FILE"; then
    echo "⚠️  VAROVANIE: Chýba FeaturedItemsSection import"
fi

if ! grep -q "import.*ContactSection" "$PAGE_FILE"; then
    echo "⚠️  VAROVANIE: Chýba ContactSection import"
fi

# Výsledok
if [ $ERRORS -eq 0 ]; then
    echo "✅ Štruktúra je v poriadku!"
    exit 0
else
    echo "❌ Nájdených $ERRORS chýb v štruktúre!"
    echo ""
    echo "🔧 RIEŠENIE:"
    echo "1. Otvorte $PAGE_FILE"
    echo "2. Odstráňte nežiaduce importy a komponenty"
    echo "3. Spustite znovu: npm run protect"
    exit 1
fi
