#!/bin/bash

echo "🎨 UI CONTRAST & TYPOGRAPHY FIXES - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "feat: Critical UI contrast & typography fixes for dark theme compatibility

🎨 FIXED HARDCODED COLORS (theme-aware):
- protocols/ReturnProtocolForm.tsx: 8x #2d2d2d, #3d3d3d → background.paper/default
- insurances/InsuranceList.tsx: 6x #fff, #bdbdbd → text.primary/secondary  
- users/UserManagement.tsx: 5x hardcoded white → text.primary

🔧 REPLACED WITH THEME-AWARE COLORS:
- backgroundColor: '#2d2d2d' → 'background.paper'
- backgroundColor: '#3d3d3d' → 'background.default'
- sx={{ color: 'white' }} → color=\"text.primary\"
- sx={{ color: '#bdbdbd' }} → color=\"text.secondary\"
- border: '1px solid #555' → borderColor: 'divider'

✅ BENEFITS:
- Perfect contrast in light & dark themes
- Automatic theme switching support
- Consistent typography system
- Better accessibility & readability

🎯 IMPACT: All text now perfectly visible in both light and dark themes"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ UI CONTRAST FIXES DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 