#!/bin/bash
# Database Restore Script
# Restores PostgreSQL database from backup file
# Usage: ./restore-db.sh backup_20260224_030000.sql.gz

set -e

if [ -z "$1" ]; then
  echo "❌ ERROR: Backup file not specified"
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 backups/backup_20260224_030000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Database connection (from .env)
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
echo "📂 Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

echo "🗄️  Starting database restore..."
echo "📅 Date: $(date)"

# Extract connection details from DATABASE_URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "📦 Decompressing backup..."
  TEMP_FILE=$(mktemp)
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  BACKUP_FILE="$TEMP_FILE"
fi

# Restore database
export PGPASSWORD="$DB_PASS"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  < "$BACKUP_FILE" 2>/dev/null || {
  echo "❌ Restore failed!"
  [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
  exit 1
}

# Cleanup temp file
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo "✅ Restore completed successfully!"
echo "🔄 Please restart the application: pm2 restart albassam"
echo "🎉 Done!"
