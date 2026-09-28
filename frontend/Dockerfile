# 프론트엔드 이미지: Next.js 정적 export 결과물(out/)을 Nginx 로 서빙한다.
#
# next.config.ts 가 `output: "export"` 라 런타임 Node 서버가 필요 없다.
# 빌드 단계에서만 Node 를 쓰고, 최종 이미지는 nginx:alpine 에 정적 파일만 담아 가볍게 유지한다.
# GITHUB_PAGES 를 넘기지 않으므로 basePath 없이 도메인 루트(/)에서 서빙된다.

# ── build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── runtime ───────────────────────────────────────────
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

EXPOSE 80
