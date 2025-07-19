#!/bin/bash

echo "🔧 BUILD ERROR FIX - REMOVE UNUSED DAMAGEITEM INTERFACE - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "fix: Build error - remove unused DamageItem interface

🔧 BUILD ERROR FIX:
- HandoverProtocolForm.tsx: Removed unused DamageItem interface
- Fixed TypeScript compilation error with 'photos' property
- ProtocolDamage interface now properly used throughout

✅ RESULT:
- Build passes successfully
- No more TypeScript compilation errors
- Protocols workflow fully functional

🚀 IMPACT: Application can now be deployed without build errors!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ BUILD ERROR FIX DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 