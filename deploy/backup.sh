#!/usr/bin/env bash
# DB·업로드 파일 백업. VM 의 root crontab 에서 매일 자정(KST) 돈다.
#
#   ./deploy/backup.sh            # /root/backups 에 저장 (+ MEGA_DIR 이 있으면 MEGA 에도 올림)
#   BACKUP_DIR=/mnt/x ./deploy/backup.sh
#
# 로컬 사본은 같은 VM 디스크에 있어 VM 이 사라지면 같이 사라진다. 그래서 MEGA(mega.nz)에도 올린다.
# MEGA 업로드는 MEGAcmd(mega-put)를 쓰며, 미리 `mega-login` 해 둔 세션을 그대로 쓴다.
set -euo pipefail

backup_dir="${BACKUP_DIR:-/root/backups}"
keep_days="${KEEP_DAYS:-14}"
mega_dir="${MEGA_DIR:-}"
mega_keep_days="${MEGA_KEEP_DAYS:-30}"
# VM 시계는 UTC 라 파일 이름만 KST 로 맞춘다.
stamp="$(TZ=Asia/Seoul date +%Y%m%d-%H%M%S)"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

db_file="$backup_dir/db-$stamp.sql.gz"
uploads_file="$backup_dir/uploads-$stamp.tar.gz"

# 비밀번호는 컨테이너 환경 변수에서 읽어 이 스크립트·프로세스 목록에 남기지 않는다.
docker exec eatomato-mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' \
  | gzip > "$db_file.part"
mv "$db_file.part" "$db_file"

docker cp eatomato-backend:/app/uploads - | gzip > "$uploads_file.part"
mv "$uploads_file.part" "$uploads_file"

find "$backup_dir" -maxdepth 1 -name '*.gz' -mtime +"$keep_days" -delete

if [[ -n "$mega_dir" ]]; then
  mega-mkdir -p "$mega_dir" 2>/dev/null || true
  # -q 는 백그라운드 큐라 바로 끝나 버린다. 끝까지 기다리도록 붙이지 않는다.
  mega-put "$db_file" "$uploads_file" "$mega_dir/" >/dev/null
  # 올라간 것을 확인한다. 없으면 실패로 끝내 cron 로그에 남긴다.
  mega-ls "$mega_dir/$(basename "$db_file")" >/dev/null 2>&1 \
    || { echo "MEGA 업로드 확인 실패: $(basename "$db_file")"; exit 1; }
  # 오래된 원격 사본 정리. 대상이 없으면 mega-find 가 실패 코드를 내므로 무시한다.
  mega-find "$mega_dir" --mtime="+${mega_keep_days}d" --type=f 2>/dev/null | while IFS= read -r old; do
    mega-rm "$old"
  done || true
  # MEGAcmd 서버 프로세스가 메모리를 계속 잡고 있지 않게 내린다(로그인 세션은 남는다).
  mega-quit >/dev/null 2>&1 || true
  echo "MEGA 업로드 완료: $mega_dir/$(basename "$db_file"), $(basename "$uploads_file")"
fi

ls -lh "$backup_dir" | tail -n 4
