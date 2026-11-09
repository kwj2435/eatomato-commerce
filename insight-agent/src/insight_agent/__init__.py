"""eatomato 마케팅 인사이트 에이전트.

Java 백엔드의 작업 큐(insight_run)에서 요청을 가져와, 개인정보를 뺀 원자료를 pandas 로 분석하는 도구를
Claude 가 골라 쓰게 하고(tool use), 근거 숫자를 붙인 리포트를 돌려준다.
"""
