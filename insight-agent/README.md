# insight-agent

eatomato 관리자 > **마케팅 인사이트**의 분석 워커(Python). Claude API 의 도구 호출(tool use)로 방문·주문·후기 데이터를 조회해,
근거 숫자가 붙은 리포트를 만든다.

## 구조

```
관리자 화면 ─요청→ Java 백엔드(insight_run 작업 큐, PENDING)
                       ↑ claim / complete        ↓ dataset (개인정보 제외 원자료)
                  insight-agent 워커 ── 분석 도구(pandas) ⇄ Claude API
```

- **작업 큐**: 워커가 `POST /internal/insights/runs/claim` 으로 몇 초마다 대기 작업을 가져가고, 끝나면 `complete` 로 결과를 보낸다.
  외부로 포트를 열지 않는다. `/internal/**` 은 공유 토큰(`X-Internal-Token`)으로 막혀 있고, 운영 nginx 도 이 경로를 넘기지 않는다.
- **원자료**: `GET /internal/insights/dataset` — 페이지 조회·구매 이벤트·주문·상품·후기. 이름·연락처·주소·주문번호·회원 아이디는 없고,
  회원은 HMAC 해시로만 구분한다(재구매 계산용).
- **도구**(`tools.py`): `overview`, `funnel_by_source`, `product_performance`, `time_patterns`, `customer_behavior`, `review_signals`.
  모두 읽기 전용이며 집계 숫자와 표본 크기만 돌려준다. 표본이 작으면 결과에 `note` 로 표시한다.
- **에이전트 루프**(`agent.py`): SDK tool runner 대신 직접 작성 — 실행당 도구 호출·턴 상한, 단계별 기록(trace), 토큰 집계.
  마지막 답은 JSON 스키마(`prompts.REPORT_SCHEMA`)로 받고, 근거 숫자가 도구 결과에 실제로 있는지 확인해(`verify_evidence`)
  없으면 화면에 "확인 필요"로 표시한다.

## 환경 변수

| 이름 | 설명 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키(SDK 가 읽음) |
| `INSIGHT_AGENT_TOKEN` | 백엔드 `app.insight.agent-token` 과 같은 값 |
| `BACKEND_URL` | 기본 `http://localhost:8080` |
| `INSIGHT_MODEL` | 기본 `claude-haiku-5-5` |
| `INSIGHT_MAX_TOOL_CALLS` / `INSIGHT_MAX_TURNS` | 실행당 상한(기본 12 / 10) |

## 로컬

```bash
uv sync
uv run pytest                      # 실제 API 를 부르지 않는 테스트
export INSIGHT_AGENT_TOKEN=local-insight-agent-token BACKEND_URL=http://localhost:8080 ANTHROPIC_API_KEY=...
uv run insight-agent worker        # 관리자 화면 요청을 처리
uv run insight-agent snapshot --out data.json          # 원자료 저장
uv run insight-agent ask "많이 보는데 안 팔리는 상품은?" --dataset data.json --model claude-sonnet-5-5
```

같은 `data.json` 으로 모델을 바꿔 `ask` 를 돌리면 모델별 결과·토큰을 비교할 수 있다.

## 운영

`backend/docker-compose.yml` 의 `insight-agent` 서비스(compose profile `insight`). `backend/.env` 에
`COMPOSE_PROFILES=insight`, `INSIGHT_AGENT_TOKEN`, `ANTHROPIC_API_KEY` 를 넣으면 `deploy/deploy.sh` 가 함께 빌드·기동한다.
