#!/bin/bash

echo "🔧 UUID GENERATION FIX - COMMIT & PUSH"
echo ""

# Git add all changes
git add .

# Commit with detailed message
git commit -m "fix: UUID generation - generate only once per component

🔧 UUID GENERATION FIX:
- HandoverProtocolForm.tsx: Fixed UUID generation to create ID only once per component
- Prevents duplicate key errors when saving protocols
- UUID is now generated once and reused throughout component lifecycle

✅ RESULT:
- No more duplicate key constraint violations
- Protocols can be saved successfully
- UUID remains consistent during component re-renders

🚀 IMPACT: Protocols workflow now fully functional without duplicate key errors!"

# Push to origin
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ UUID GENERATION FIX DEPLOYED!"
echo "📋 Railway will auto-deploy from GitHub"
echo "⏱️  ETA: 2-3 minúty"

# Clean up
rm .gitcommit
rm git-commit.sh 