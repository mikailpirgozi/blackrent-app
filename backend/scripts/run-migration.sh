#!/bin/bash

# Run Database Migration for Auth System
# This script applies the complete auth system migration

echo "🔧 Running Database Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set DATABASE_URL in your .env file or export it:"
    echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
    exit 1
fi

echo "📊 Database: $DATABASE_URL"
echo ""

# Run the migration
psql "$DATABASE_URL" -f migrations/001_complete_auth_system.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run seed script: npm run seed:auth"
    echo "2. Test login with super admin account"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above"
    exit 1
fi

