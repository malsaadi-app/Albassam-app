#!/bin/bash
# Daily backup script for Albassam Schools App database

# Configuration
DB_PATH="/data/.openclaw/workspace/albassam-tasks/prisma/prod.db"
BACKUP_DIR="/data/.openclaw/workspace/albassam-tasks/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/prod-${DATE}.db"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Create backup
cp "$DB_PATH" "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

# Set secure permissions
chmod 600 "${BACKUP_FILE}.gz"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "prod-*.db.gz" -mtime +30 -delete

echo "✅ Backup completed: ${BACKUP_FILE}.gz"
echo "📊 Backup size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
echo "📁 Total backups: $(ls -1 $BACKUP_DIR | wc -l)"
