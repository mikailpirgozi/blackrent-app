#!/bin/bash
# ✅ FÁZA 1.1: Spustenie timezone fix migrácie

set -e  # Exit on error

echo "🚀 Starting expense date timezone fix migration..."
echo ""

# Database credentials
DB_HOST="trolley.proxy.rlwy.net"
DB_USER="postgres"
DB_PORT="13400"
DB_NAME="railway"

# Check if PGPASSWORD is set
if [ -z "$PGPASSWORD" ]; then
  echo "⚠️  PGPASSWORD not set in environment"
  echo "Please set it before running: export PGPASSWORD=your_password"
  exit 1
fi

# Backup before migration
echo "📦 Creating backup..."
BACKUP_FILE="backup_before_timezone_fix_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME > "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Run migration
echo "🔧 Running timezone fix migration..."
psql -h $DB_HOST -U $DB_USER -p $DB_PORT -d $DB_NAME -f 003_expense_date_timezone_fix.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📊 Summary:"
  echo "  - expenses.date: TIMESTAMP → DATE"
  echo "  - recurring_expenses dates: TIMESTAMP → DATE"
  echo "  - Backup saved: $BACKUP_FILE"
  echo ""
  echo "🎯 Next steps:"
  echo "  1. Test creating a new expense with date 15.01.2025"
  echo "  2. Edit the expense"
  echo "  3. Verify date is still 15.01.2025 (not 14.01!)"
else
  echo ""
  echo "❌ Migration failed!"
  echo "Database was NOT modified (transaction rolled back)"
  echo "Check errors above"
  exit 1
fi

