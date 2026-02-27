#!/bin/bash
# Enhanced PostgreSQL Backup Script for Albassam Schools App
# Supports: PostgreSQL (Supabase), error handling, notifications, retention

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# ===========================
# Configuration
# ===========================

# Backup directory
BACKUP_DIR="/data/.openclaw/workspace/albassam-tasks/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="albassam_db_${DATE}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Database connection (from .env)
ENV_FILE="/data/.openclaw/workspace/albassam-tasks/.env"

# Retention policy
RETENTION_DAYS=30
MAX_BACKUPS=50

# Notification settings
NOTIFY_ON_ERROR=true
NOTIFY_ON_SUCCESS=false

# ===========================
# Functions
# ===========================

log() {
  local level="$1"
  shift
  local message="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

notify() {
  local title="$1"
  local message="$2"
  local priority="${3:-normal}"
  
  # Log notification
  log "NOTIFY" "$title: $message"
  
  # TODO: Add notification integration (email, Telegram, etc.)
  # For now, just log
}

get_db_url() {
  if [[ ! -f "$ENV_FILE" ]]; then
    log "ERROR" ".env file not found at $ENV_FILE"
    exit 1
  fi
  
  # Extract DATABASE_URL from .env
  local db_url=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  
  if [[ -z "$db_url" ]]; then
    log "ERROR" "DATABASE_URL not found in .env"
    exit 1
  fi
  
  echo "$db_url"
}

parse_db_url() {
  local url="$1"
  
  # Parse PostgreSQL URL
  # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
  
  if [[ ! "$url" =~ ^postgresql:// ]]; then
    log "ERROR" "Invalid PostgreSQL URL format"
    exit 1
  fi
  
  # Extract components using regex
  local pattern="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)"
  
  if [[ "$url" =~ $pattern ]]; then
    export PGUSER="${BASH_REMATCH[1]}"
    export PGPASSWORD="${BASH_REMATCH[2]}"
    export PGHOST="${BASH_REMATCH[3]}"
    export PGPORT="${BASH_REMATCH[4]}"
    export PGDATABASE="${BASH_REMATCH[5]}"
  else
    log "ERROR" "Failed to parse DATABASE_URL"
    exit 1
  fi
}

check_dependencies() {
  if ! command -v pg_dump &> /dev/null; then
    log "ERROR" "pg_dump not found. Install PostgreSQL client: apt-get install postgresql-client"
    exit 1
  fi
  
  if ! command -v gzip &> /dev/null; then
    log "ERROR" "gzip not found"
    exit 1
  fi
}

create_backup() {
  log "INFO" "Starting PostgreSQL backup..."
  
  # Create backup directory
  mkdir -p "$BACKUP_DIR"
  
  # Get database connection info
  local db_url=$(get_db_url)
  parse_db_url "$db_url"
  
  log "INFO" "Database: $PGDATABASE@$PGHOST:$PGPORT"
  
  # Create backup using pg_dump
  if pg_dump \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --no-password \
    --format=plain \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    --file="$BACKUP_PATH" 2>&1 | tee -a "$LOG_FILE"; then
    
    log "INFO" "Database dump completed: $BACKUP_PATH"
  else
    log "ERROR" "pg_dump failed"
    notify "❌ Backup Failed" "pg_dump command failed. Check logs." "urgent"
    exit 1
  fi
  
  # Compress backup
  log "INFO" "Compressing backup..."
  if gzip -f "$BACKUP_PATH"; then
    log "INFO" "Compression completed: ${BACKUP_PATH}.gz"
  else
    log "ERROR" "Compression failed"
    notify "⚠️ Backup Warning" "Backup created but compression failed" "high"
  fi
  
  # Set secure permissions
  chmod 600 "${BACKUP_PATH}.gz"
  
  # Get backup size
  local size=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
  log "INFO" "Backup size: $size"
  
  return 0
}

verify_backup() {
  local backup_file="${BACKUP_PATH}.gz"
  
  log "INFO" "Verifying backup integrity..."
  
  # Check if file exists and is not empty
  if [[ ! -f "$backup_file" ]]; then
    log "ERROR" "Backup file not found: $backup_file"
    return 1
  fi
  
  if [[ ! -s "$backup_file" ]]; then
    log "ERROR" "Backup file is empty: $backup_file"
    return 1
  fi
  
  # Test gzip integrity
  if gzip -t "$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
    log "INFO" "Backup integrity verified ✓"
    return 0
  else
    log "ERROR" "Backup file is corrupted"
    return 1
  fi
}

cleanup_old_backups() {
  log "INFO" "Cleaning up old backups..."
  
  # Delete backups older than RETENTION_DAYS
  local deleted=0
  while IFS= read -r file; do
    rm -f "$file"
    log "INFO" "Deleted old backup: $(basename $file)"
    ((deleted++))
  done < <(find "$BACKUP_DIR" -name "albassam_db_*.sql.gz" -mtime +${RETENTION_DAYS})
  
  # Keep only MAX_BACKUPS most recent backups
  local total=$(ls -1 "$BACKUP_DIR"/albassam_db_*.sql.gz 2>/dev/null | wc -l)
  if [[ $total -gt $MAX_BACKUPS ]]; then
    local to_delete=$((total - MAX_BACKUPS))
    log "INFO" "Too many backups ($total). Deleting oldest $to_delete..."
    ls -t "$BACKUP_DIR"/albassam_db_*.sql.gz | tail -n $to_delete | xargs -r rm
    ((deleted+=$to_delete))
  fi
  
  if [[ $deleted -gt 0 ]]; then
    log "INFO" "Cleaned up $deleted old backup(s)"
  else
    log "INFO" "No old backups to clean up"
  fi
}

get_backup_stats() {
  local count=$(ls -1 "$BACKUP_DIR"/albassam_db_*.sql.gz 2>/dev/null | wc -l)
  local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
  local oldest=""
  local newest=""
  
  if [[ $count -gt 0 ]]; then
    oldest=$(ls -t "$BACKUP_DIR"/albassam_db_*.sql.gz | tail -1 | xargs basename)
    newest=$(ls -t "$BACKUP_DIR"/albassam_db_*.sql.gz | head -1 | xargs basename)
  fi
  
  log "INFO" "Backup Statistics:"
  log "INFO" "  - Total backups: $count"
  log "INFO" "  - Total size: $total_size"
  log "INFO" "  - Oldest: $oldest"
  log "INFO" "  - Newest: $newest"
}

# ===========================
# Main Execution
# ===========================

main() {
  log "INFO" "========================================="
  log "INFO" "PostgreSQL Backup Started"
  log "INFO" "========================================="
  
  # Check dependencies
  check_dependencies
  
  # Create backup
  if create_backup; then
    # Verify backup
    if verify_backup; then
      # Cleanup old backups
      cleanup_old_backups
      
      # Show statistics
      get_backup_stats
      
      log "INFO" "========================================="
      log "INFO" "✅ Backup Completed Successfully"
      log "INFO" "========================================="
      
      if [[ "$NOTIFY_ON_SUCCESS" == "true" ]]; then
        notify "✅ Backup Success" "Database backup completed successfully"
      fi
      
      exit 0
    else
      log "ERROR" "Backup verification failed"
      notify "❌ Backup Failed" "Backup created but verification failed" "urgent"
      exit 1
    fi
  else
    log "ERROR" "Backup creation failed"
    notify "❌ Backup Failed" "Failed to create database backup" "urgent"
    exit 1
  fi
}

# Trap errors
trap 'log "ERROR" "Script failed at line $LINENO"' ERR

# Run main function
main "$@"
