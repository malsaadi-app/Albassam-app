#!/bin/bash
# Database Backup Script
# Backs up PostgreSQL database to local file
# Run daily via cron: 0 3 * * * /path/to/backup-db.sh

set -e

# Configuration
BACKUP_DIR="/data/.openclaw/workspace/albassam-tasks/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
KEEP_DAYS=7

# Database connection (from .env)
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  exit 1
fi

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup..."
echo "📅 Date: $(date)"
echo "📁 Backup file: $BACKUP_FILE"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Use pg_dump to create backup
export PGPASSWORD="$DB_PASS"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl --clean --if-exists \
  > "$BACKUP_FILE" 2>/dev/null || {
  echo "❌ Backup failed!"
  exit 1
}

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📦 Size: $BACKUP_SIZE"
echo "📂 Location: $BACKUP_FILE"

# Cleanup old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last $KEEP_DAYS days)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$KEEP_DAYS -delete

REMAINING=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
echo "📊 Total backups: $REMAINING"

# Log to file
echo "$(date): Backup completed ($BACKUP_SIZE) - $BACKUP_FILE" >> "$BACKUP_DIR/backup.log"

echo "🎉 Done!"
