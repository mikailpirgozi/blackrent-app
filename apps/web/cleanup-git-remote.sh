#!/bin/bash
echo "🌐 GIT REMOTE CLEANUP SCRIPT (GitHub)"
echo "======================================"
echo ""
echo "⚠️ POZOR: Toto vymaže branche na GitHube!"
echo "Pokračovať? (y/n)"
read -r response

if [[ "$response" != "y" ]]; then
    echo "❌ Zrušené používateľom"
    exit 0
fi

echo ""
echo "🗑️ Mazanie zbytočných remote branchov..."

# Cursor auto-generated branche
echo "Mazanie cursor/* branchov..."
git push origin --delete cursor/analyze-protocol-section-and-photo-storage-3cd8 2>/dev/null || true
git push origin --delete cursor/aud-torska-anal-za-pre-verejn-web-3d65 2>/dev/null || true
git push origin --delete cursor/check-blackrent-web-application-status-a2c8 2>/dev/null || true
git push origin --delete cursor/find-and-fix-recent-warnings-52b4 2>/dev/null || true
git push origin --delete cursor/implement-infinite-scroll-with-server-side-filtering-8dab 2>/dev/null || true
git push origin --delete cursor/optimize-rental-listing-pre-fetching-5fa4 2>/dev/null || true

# Backup branche
echo "Mazanie backup branchov..."
git push origin --delete backup-mobile-fix-attempt 2>/dev/null || true
git push origin --delete backup-v2-implementation 2>/dev/null || true
git push origin --delete backup/beta-4-20250723 2>/dev/null || true

# Cache a restore branche
echo "Mazanie cache/restore branchov..."
git push origin --delete cache-migration-backup 2>/dev/null || true
git push origin --delete cache-migration-work 2>/dev/null || true
git push origin --delete restore-beta-4 2>/dev/null || true
git push origin --delete restore-working-protocols 2>/dev/null || true

# Staré feature branche
echo "Mazanie starých feature branchov..."
git push origin --delete console-log-optimization 2>/dev/null || true
git push origin --delete feature/hmr-optimization-safe 2>/dev/null || true
git push origin --delete feature/protocols-v2 2>/dev/null || true
git push origin --delete fix/mobile-availability-tooltip 2>/dev/null || true
git push origin --delete web-only-updates 2>/dev/null || true
git push origin --delete working-state-test 2>/dev/null || true

# Staré design branche
echo "Mazanie starých design branchov..."
git push origin --delete design-with-protocols 2>/dev/null || true
git push origin --delete modern-design-working-protocols 2>/dev/null || true
git push origin --delete main-final-clean 2>/dev/null || true

# gh-pages (ak nepoužívaš GitHub Pages)
echo "Mazanie gh-pages (ak nepoužívaš GitHub Pages)..."
# git push origin --delete gh-pages 2>/dev/null || true

echo ""
echo "🔄 Aktualizácia lokálnych remote tracking branchov..."
git fetch --prune

echo ""
echo "✅ REMOTE ČISTENIE DOKONČENÉ!"
echo ""
echo "📋 ZOSTÁVAJÚCE REMOTE BRANCHE:"
git branch -r
