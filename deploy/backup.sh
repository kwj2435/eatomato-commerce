#!/usr/bin/env bash
# DB·업로드 파일 백업. VM 의 root crontab 에서 매일 돈다.
#
#   ./deploy/backup.sh            # /root/backups 에 저장
#   BACKUP_DIR=/mnt/x ./deploy/backup.sh
#
# 같은 VM 디스크에 두므로 VM 이 사라지면 같이 사라진다. 주기적으로 밖으로 내려받아 둘 것.
set -euo pipefail

backup_dir="${BACKUP_DIR:-/root/backups}"
keep_days="${KEEP_DAYS:-14}"
stamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

# 비밀번호는 컨테이너 환경 변수에서 읽어 이 스크립트·프로세스 목록에 남기지 않는다.
docker exec eatomato-mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' \
  | gzip > "$backup_dir/db-$stamp.sql.gz.part"
mv "$backup_dir/db-$stamp.sql.gz.part" "$backup_dir/db-$stamp.sql.gz"

docker cp eatomato-backend:/app/uploads - | gzip > "$backup_dir/uploads-$stamp.tar.gz.part"
mv "$backup_dir/uploads-$stamp.tar.gz.part" "$backup_dir/uploads-$stamp.tar.gz"

find "$backup_dir" -maxdepth 1 -name '*.gz' -mtime +"$keep_days" -delete
ls -lh "$backup_dir" | tail -n 4
