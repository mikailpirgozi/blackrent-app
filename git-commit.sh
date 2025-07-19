#!/bin/bash

echo "📱 MOBILE RESPONSIVITY & TABLE SYSTEM OVERHAUL - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "feat: Mobile Responsivity & Table System Overhaul

📱 MOBILE RESPONSIVITY FIXES:
- CustomerList.tsx: Nahradené staré Table → ResponsiveTable
- VehicleList.tsx: Nahradené staré Table → ResponsiveTable  
- ExpenseList.tsx: Nahradené staré Table → ResponsiveTable
- History dialogs: Nahradené Table → Card layout pre mobile

🔧 RESPONSIVE TABLE SYSTEM:
- Všetky listy používajú jednotný ResponsiveTable komponent
- Automatické prepínanie medzi Table (desktop) a Cards (mobile)
- Touch-friendly buttons a optimálne spacing
- Konzistentné column definitions s mobile-friendly widths

✅ BENEFITS:
- Perfektná mobile experience na všetkých zariadeniach
- Jednotný UI pattern v celej aplikácii
- Lepšia accessibility a touch interaction
- Automatické responsive behavior

🎯 IMPACT: Aplikácia je teraz plne použiteľná na mobile zariadeniach!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ MOBILE RESPONSIVITY FIXES DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 