#!/bin/bash
echo "🧹 GIT CLEANUP SCRIPT"
echo "===================="
echo ""

# KROK 1: Backup aktuálnej práce
echo "📦 KROK 1: Backup aktuálnej práce..."
git stash push -m "Backup before cleanup $(date)"
echo "✅ Práca uložená do stash"
echo ""

# KROK 2: Zmazať lokálne backup branche
echo "🗑️ KROK 2: Čistenie lokálnych backup branchov..."
git branch -D backup-before-mobile-fix 2>/dev/null || true
git branch -D backup-mobile-fix-attempt 2>/dev/null || true
git branch -D backup-v2-implementation 2>/dev/null || true
git branch -D cache-migration-backup 2>/dev/null || true
git branch -D cache-migration-work 2>/dev/null || true
git branch -D shadcn-migration-backup 2>/dev/null || true
git branch -D shadcn-migration-final 2>/dev/null || true
git branch -D working-state-test 2>/dev/null || true
git branch -D restore-beta-4 2>/dev/null || true
git branch -D main-clean 2>/dev/null || true
echo "✅ Lokálne backup branche zmazané"
echo ""

# KROK 3: Zmazať lokálne feature branche (už zmergované)
echo "🗑️ KROK 3: Čistenie starých feature branchov..."
git branch -D console-log-optimization 2>/dev/null || true
git branch -D useRentals-optimization 2>/dev/null || true
git branch -D web-only-updates 2>/dev/null || true
git branch -D fix/mobile-availability-tooltip 2>/dev/null || true
git branch -D feature/hmr-optimization-clean 2>/dev/null || true
git branch -D feature/hmr-optimization-safe 2>/dev/null || true
git branch -D feature/protocols-v2 2>/dev/null || true
echo "✅ Staré feature branche zmazané"
echo ""

# KROK 4: Ukázať zostávajúce lokálne branche
echo "📋 ZOSTÁVAJÚCE LOKÁLNE BRANCHE:"
git branch
echo ""

# KROK 5: Obnoviť prácu
echo "📦 KROK 5: Obnova tvojej práce..."
git stash pop
echo "✅ Práca obnovená"
echo ""

echo "✅ LOKÁLNE ČISTENIE DOKONČENÉ!"
echo ""
echo "⚠️ POZOR: Remote branche na GitHube treba vymazať osobne!"
echo "Spusti tento skript pre zmazanie remote branchov: ./cleanup-git-remote.sh"
