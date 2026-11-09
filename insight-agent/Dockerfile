# 마케팅 인사이트 워커. backend/docker-compose.yml 의 insight-agent 서비스가 빌드한다.
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.11.12 /uv /bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONUNBUFFERED=1 TZ=Asia/Seoul

WORKDIR /app
# 의존성 먼저(소스가 바뀌어도 캐시 재사용), uv.lock 버전 그대로
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY src ./src
RUN uv sync --frozen --no-dev

RUN useradd --create-home --uid 10001 agent
USER agent

CMD ["/app/.venv/bin/insight-agent", "worker"]
