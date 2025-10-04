#!/bin/bash

# ===============================================
# EXPENSE INDEXES MIGRATION SCRIPT
# ===============================================
# Spustenie: ./scripts/run-expense-migration.sh
# ===============================================

echo "🚀 Starting expense indexes migration..."
echo ""

# Railway PostgreSQL credentials
PGPASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
PGHOST="trolley.proxy.rlwy.net"
PGPORT="13400"
PGUSER="postgres"
PGDATABASE="railway"

# Migration file
MIGRATION_FILE="migrations/add_expense_indexes.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🔗 Database: $PGHOST:$PGPORT"
echo ""

# Run migration
echo "⚙️  Running migration..."
PGPASSWORD="$PGPASSWORD" psql \
  -h "$PGHOST" \
  -U "$PGUSER" \
  -p "$PGPORT" \
  -d "$PGDATABASE" \
  -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  echo ""
  echo "📊 Verifying indexes..."
  echo ""
  
  # Verify indexes
  PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -U "$PGUSER" \
    -p "$PGPORT" \
    -d "$PGDATABASE" \
    -c "SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('expenses', 'recurring_expenses') ORDER BY tablename, indexname;"
  
  echo ""
  echo "🎉 Done! Expenses indexes created successfully."
  echo ""
  echo "Next steps:"
  echo "1. Test query performance in Expenses section"
  echo "2. Check if loading is faster (< 2s)"
  echo "3. Verify filters are instant (< 100ms)"
else
  echo ""
  echo "❌ Migration failed!"
  echo "Check the error message above."
  exit 1
fi

