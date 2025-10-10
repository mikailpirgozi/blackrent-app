#!/bin/bash

# ============================================================================
# BLACKRENT PLATFORM MULTI-TENANCY MIGRATIONS
# ============================================================================
# This script runs all platform-related database migrations
# ============================================================================

set -e  # Exit on any error

echo "🚀 Starting BlackRent Platform Migrations..."
echo "================================================"

# Load environment variables
if [ -f "../.env" ]; then
  source ../.env
  echo "✅ Environment variables loaded"
else
  echo "❌ Error: .env file not found"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env"
  exit 1
fi

echo "📊 Database: ${DATABASE_URL%%\?*}"  # Print without query params
echo ""

# Function to run SQL file
run_migration() {
  local migration_file=$1
  echo "⏳ Running migration: $migration_file"
  
  if psql "$DATABASE_URL" -f "$migration_file"; then
    echo "✅ Migration completed: $migration_file"
  else
    echo "❌ Migration failed: $migration_file"
    exit 1
  fi
  
  echo ""
}

# Run migrations in order
echo "1️⃣ Running Platform Multi-Tenancy Migration..."
run_migration "001_add_platform_multi_tenancy.sql"

echo "2️⃣ Running Linked Investor ID Migration..."
run_migration "002_add_linked_investor_id.sql"

echo "================================================"
echo "🎉 All migrations completed successfully!"
echo ""
echo "📝 Verification queries:"
echo "  SELECT * FROM platforms;"
echo "  SELECT id, username, role, platform_id, linked_investor_id FROM users WHERE role IN ('admin', 'investor');"
echo "  SELECT id, name, platform_id FROM companies LIMIT 10;"
echo ""

