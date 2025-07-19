#!/bin/bash

echo "🎨 MINOR UI FIXES - CONSISTENT COLOR PROPS & TYPOGRAPHY - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "feat: Minor UI fixes - consistent color props and typography

🎨 MINOR UI FIXES:
- ReturnProtocolForm.tsx: 2x white → text.primary
- SerialPhotoCapture.tsx: 8x white → text.primary
- LoginForm.tsx: 3x white → text.primary
- Layout.tsx: 2x hardcoded colors → theme colors
- ExpenseList.tsx: 8x hardcoded colors → theme colors
- SettlementList.tsx: 2x hardcoded colors → theme colors
- CustomerList.tsx: 6x hardcoded colors → theme colors

🔧 STANDARDIZED COLOR SYSTEM:
- sx={{ color: 'white' }} → color=\"text.primary\"
- sx={{ color: '#666' }} → color=\"text.secondary\"
- sx={{ color: '#111' }} → color=\"text.primary\"
- sx={{ color: '#444' }} → color=\"text.secondary\"
- sx={{ color: '#2563eb' }} → color=\"primary.main\"
- sx={{ backgroundColor: '#f8fafc' }} → backgroundColor=\"background.default\"

✅ BENEFITS:
- Perfect theme consistency across all components
- Automatic light/dark theme switching support
- Better accessibility and readability
- Maintainable and scalable color system

🎯 IMPACT: All UI components now use consistent theme-aware colors!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ MINOR UI FIXES DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 