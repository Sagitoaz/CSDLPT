#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash infrastructure/mongodb/backup-restore.sh backup [backup-name]
  bash infrastructure/mongodb/backup-restore.sh restore <backup-path> [--drop]

Environment:
  MONGODB_URI   Required connection string for the replica set.
  BACKUP_ROOT   Backup destination root directory. Default: backup

Examples:
  MONGODB_URI='mongodb://user:pass@host1,host2,host3/charity_distributed?replicaSet=rsCharity&authSource=admin' \
    bash infrastructure/mongodb/backup-restore.sh backup

  MONGODB_URI='mongodb://user:pass@host1,host2,host3/charity_distributed?replicaSet=rsCharity&authSource=admin' \
    bash infrastructure/mongodb/backup-restore.sh restore backup/20260414-120000/charity_distributed --drop
EOF
}

require_uri() {
  if [[ -z "${MONGODB_URI:-}" ]]; then
    echo "MONGODB_URI is required" >&2
    exit 1
  fi
}

action="${1:-}"

case "$action" in
  backup)
    require_uri
    backup_name="${2:-$(date +%Y%m%d-%H%M%S)}"
    backup_root="${BACKUP_ROOT:-backup}"
    target_dir="$backup_root/$backup_name"

    mkdir -p "$target_dir"
    mongodump --uri="$MONGODB_URI" --out "$target_dir"
    echo "Backup created at: $target_dir"
    ;;
  restore)
    require_uri
    backup_path="${2:-}"
    restore_flag="${3:-}"

    if [[ -z "$backup_path" ]]; then
      usage
      exit 1
    fi

    args=(--uri="$MONGODB_URI")
    if [[ "$restore_flag" == "--drop" ]]; then
      args+=(--drop)
    fi

    mongorestore "${args[@]}" "$backup_path"
    echo "Restore completed from: $backup_path"
    ;;
  ""|help|-h|--help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac