# insight-agent

eatomato 관리자 > **개선 제안**의 분석 워커(Python). 매일 아침 Claude API 의 도구 호출(tool use)로 방문·주문·후기 데이터를 조회해
기획·디자인·마케팅·운영 개선 제안(근거 숫자 포함)을 만들고, 완료된 제안의 효과를 전후 지표로 확인한다.

## 구조

```
매일 08:00(백엔드 스케줄) · 관리자 '지금 분석하기' ─→ Java 백엔드(insight_run 작업 큐, PENDING)
                       ↑ claim / complete(제안 저장)    ↓ dataset(개인정보 제외 원자료) · suggestions/context(지난 제안)
                  insight-agent 워커 ── 분석 도구(pandas) ⇄ Claude API
관리자 > 개선 제안 보드: 새 제안 → 채택·보류·제외 → 완료 → 7일 뒤 효과 확인
```

- **작업 큐**: 워커가 `POST /internal/insights/runs/claim` 으로 몇 초마다 대기 작업을 가져가고, 끝나면 `complete` 로 결과를 보낸다.
  외부로 포트를 열지 않는다. `/internal/**` 은 공유 토큰(`X-Internal-Token`)으로 막혀 있고, 운영 nginx 도 이 경로를 넘기지 않는다.
- **원자료**: `GET /internal/insights/dataset` — 페이지 조회·구매 이벤트·주문·상품·후기. 이름·연락처·주소·주문번호·회원 아이디는 없고,
  회원은 HMAC 해시로만 구분한다(재구매 계산용).
- **지난 제안**: `GET /internal/insights/suggestions/context` — 최근 60일·열린 제안(중복 방지)과 완료 7일이 지난 효과 확인 대상.
  같은 문제가 다시 보이면 새 제안 대신 `reconfirmed` 로, 효과 확인은 `follow_ups` 로 돌려준다(백엔드가 보드에 반영).
- **도구**(`tools.py`): `overview`, `funnel_by_source`, `product_performance`, `time_patterns`, `customer_behavior`, `review_signals`,
  `page_flow`(화면 흐름·이탈·기기별 차이), `compare_before_after`(완료일 전후 비교).
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
uv run insight-agent snapshot --out data.json          # 원자료·지난 제안 저장
uv run insight-agent run --dataset data.json --model claude-sonnet-5-5   # 보드에 저장하지 않고 결과만 출력
```

같은 `data.json` 으로 모델을 바꿔 `run` 을 돌리면 모델별 결과·토큰을 비교할 수 있다.

## 운영

`backend/docker-compose.yml` 의 `insight-agent` 서비스(compose profile `insight`). `backend/.env` 에
`COMPOSE_PROFILES=insight`, `INSIGHT_AGENT_TOKEN`, `ANTHROPIC_API_KEY` 를 넣으면 `deploy/deploy.sh` 가 함께 빌드·기동한다.
