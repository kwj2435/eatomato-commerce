#!/usr/bin/env bash
# VM 배포 스크립트. VM 에서 저장소 루트(~/eatomato-commerce)에서 실행한다.
#
#   ./deploy/deploy.sh            # 백엔드 + 프론트
#   ./deploy/deploy.sh frontend   # 프론트만
#
# 프론트는 빌드 시점에 백엔드 API 에서 데이터를 받으므로 백엔드를 먼저 띄운다.
set -euo pipefail
cd "$(dirname "$0")/.."

target="${1:-all}"

git pull --ff-only

if [[ "$target" == "all" || "$target" == "backend" ]]; then
  [[ -f backend/.env ]] || { echo "backend/.env 가 없습니다 (backend/.env.example 참고)"; exit 1; }
  sudo docker compose -f backend/docker-compose.yml up -d --build
  echo "백엔드 기동 대기..."
  for _ in $(seq 1 60); do
    curl -sf http://127.0.0.1:8080/actuator/health >/dev/null && break
    sleep 2
  done
  curl -sf http://127.0.0.1:8080/actuator/health >/dev/null || { echo "백엔드가 응답하지 않습니다"; exit 1; }
fi

if [[ "$target" == "all" || "$target" == "frontend" ]]; then
  sudo docker compose -f frontend/docker-compose.yml up -d --build
fi

sudo docker ps --filter name=eatomato --format '{{.Names}}\t{{.Status}}'
