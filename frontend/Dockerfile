# 프론트엔드 이미지: Next.js standalone 서버(Node).
#
# 상품·배너·공지는 빌드 시점에 백엔드 API 에서 받아 미리 렌더하고, 운영 중에는 60초마다 다시 받아 갱신한다.
# 그래서 빌드할 때도, 돌 때도 백엔드에 닿아야 한다. VM 에서는 host 네트워크로 127.0.0.1:8080 을 부른다.
# - API_BASE_URL: 서버(빌드·런타임)가 부를 백엔드 주소
# - NEXT_PUBLIC_API_BASE_URL: 브라우저가 부를 주소. 비우면 같은 출처(/api) → 호스트 nginx 가 백엔드로 넘긴다.
#   (빌드 시점에 번들에 박히므로 build arg 로 넘긴다)

# ── build ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG API_BASE_URL=http://127.0.0.1:8080
ARG NEXT_PUBLIC_API_BASE_URL=
ENV API_BASE_URL=$API_BASE_URL NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runtime ───────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 TZ=Asia/Seoul
# standalone 은 public/·.next/static 을 포함하지 않아 직접 옮긴다.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
