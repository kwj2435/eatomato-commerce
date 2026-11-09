import pytest

from insight_agent.data import Dataset
from insight_agent.tools import TOOL_DEFINITIONS, ToolInputError, run_tool


def test_overview_compares_with_previous_week(ds):
    result = run_tool(ds, "overview", {"days": 7})
    current = result["current"]
    assert result["period"] == {"from": "2026-11-03", "to": "2026-11-09", "days": 7}
    assert current["sessions"] == 30
    assert current["product_view_sessions"] == 22
    assert current["add_to_cart_sessions"] == 4
    assert current["purchase_sessions"] == 2
    assert current["conversion_pct"] == 6.7
    assert current["paid_orders"] == 2
    assert current["revenue"] == 28000
    assert current["average_order_value"] == 14000
    assert current["refunded_orders"] == 1
    assert current["unpaid_cancelled_orders"] == 1
    assert result["previous"]["sessions"] == 15
    assert result["change_pct"]["sessions"] == 100.0
    # 결제 주문 2건은 5건 미만이라 표본 부족 표시
    assert "표본이 적어" in result["note"]


def test_overview_without_previous_data_does_not_compare(raw):
    raw["from"] = "2026-11-05T00:00:00"
    result = run_tool(Dataset.from_json(raw), "overview", {"days": 7})
    assert result["previous"] is None
    assert "비교하지 않았습니다" in result["comparison_note"]


def test_funnel_by_campaign(ds):
    result = run_tool(ds, "funnel_by_source", {"days": 7, "dimension": "campaign", "limit": 10})
    groups = {g["group"]: g for g in result["groups"]}
    assert groups["post-a"]["sessions"] == 10
    assert groups["post-a"]["purchase_sessions"] == 2
    assert groups["post-a"]["conversion_pct"] == 20.0
    assert groups["post-a"]["tracked_revenue"] == 30000
    assert groups["(캠페인 링크 없음)"]["sessions"] == 20
    assert groups["(캠페인 링크 없음)"]["purchase_sessions"] == 0
    # 방문 많은 순
    assert result["groups"][0]["group"] == "(캠페인 링크 없음)"


def test_funnel_by_referrer_labels_direct_visits(ds):
    result = run_tool(ds, "funnel_by_source", {"days": 7, "dimension": "referrer", "limit": 1})
    assert result["groups"][0]["group"] == "(직접 방문)"
    assert result["other_groups"] == 1


def test_product_performance_sorts(ds):
    by_views = run_tool(ds, "product_performance", {"days": 7, "sort_by": "views", "limit": 10})["products"]
    assert [p["name"] for p in by_views] == ["톡 RED SQUARE", "톡 CREAM ROUND"]
    red, cream = by_views
    assert red["view_sessions"] == 12 and red["orders"] == 0 and red["discount_pct"] == 20
    assert cream["orders"] == 2 and cream["revenue"] == 30000 and cream["view_to_order_pct"] == 20.0

    by_revenue = run_tool(ds, "product_performance", {"days": 7, "sort_by": "revenue", "limit": 10})["products"]
    assert by_revenue[0]["name"] == "톡 CREAM ROUND"

    low = run_tool(ds, "product_performance", {"days": 7, "sort_by": "low_conversion", "limit": 10})
    # 조회 10회 이상인 두 상품 중 전환이 낮은 RED SQUARE 가 먼저
    assert [p["name"] for p in low["products"]] == ["톡 RED SQUARE", "톡 CREAM ROUND"]


def test_customer_behavior_counts_returning_buyers_and_coupons(ds):
    result = run_tool(ds, "customer_behavior", {"days": 7})
    assert result["paid_orders"] == 2
    assert result["unique_member_buyers"] == 2
    assert result["returning_buyers"] == 1  # b1 은 지난주에도 결제
    assert result["coupon_orders"] == 1
    assert result["aov_with_coupon"] == 13000
    assert result["aov_without_coupon"] == 15000
    assert result["refunded_orders"] == 1
    assert result["unpaid_cancelled_orders"] == 1


def test_time_patterns_have_all_weekdays(ds):
    result = run_tool(ds, "time_patterns", {"days": 7})
    assert [d["weekday"] for d in result["by_weekday"]] == ["월", "화", "수", "목", "금", "토", "일"]
    # 직접 방문 20회는 토요일 10:30 부터 1시간 간격이라 6회는 자정을 넘겨 일요일
    saturday, sunday = result["by_weekday"][5], result["by_weekday"][6]
    assert (saturday["sessions"], sunday["sessions"]) == (24, 6)
    assert saturday["paid_orders"] == 2


def test_review_signals_show_low_rating_excerpts(ds):
    result = run_tool(ds, "review_signals", {"days": 7})
    assert result["reviews"] == 2
    assert result["average_rating"] == 3.0
    assert result["photo_review_pct"] == 50.0
    assert result["low_rating_excerpts"] == [
        {"name": "톡 CREAM ROUND", "rating": 1, "excerpt": "케이스가 금방 깨질 것 같아요", "date": "2026-11-07"}]


def _params_for(definition: dict, days: int = 7) -> dict:
    """도구마다 필요한 입력만 골라 준다."""
    common = {"days": days, "dimension": "campaign", "sort_by": "views", "limit": 5}
    if definition["name"] == "compare_before_after":
        return {"date": "2026-11-05", "days": 7}
    props = definition["input_schema"]["properties"]
    return {k: v for k, v in common.items() if k in props}


def test_empty_dataset_does_not_crash():
    ds = Dataset.from_json({"from": "2026-11-01T00:00:00", "to": "2026-11-09T10:00:00"})
    for definition in TOOL_DEFINITIONS:
        result = run_tool(ds, definition["name"], _params_for(definition))
        assert isinstance(result, dict)


def test_product_performance_explains_empty_stock(ds):
    result = run_tool(ds, "product_performance", {"days": 7, "sort_by": "views", "limit": 5})
    red = next(p for p in result["products"] if p["name"] == "톡 RED SQUARE")
    assert red["stock"] is None
    assert "재고를 관리하지 않는 상품" in result["stock_note"]


def test_page_flow(ds):
    result = run_tool(ds, "page_flow", {"days": 7})
    assert result["sessions"] == 30
    # 상품을 본 22회는 2화면, 나머지 8회는 메인만 보고 나감
    assert result["bounce_pct"] == 26.7
    assert result["avg_pages"] == 1.73
    assert result["entries"] == [{"page_type": "HOME", "sessions": 30, "bounce_pct": 26.7, "purchase_pct": 6.7}]
    assert {e["page_type"]: e["sessions"] for e in result["exits"]} == {"PRODUCT": 22, "HOME": 8}
    mobile = result["by_device"][0]
    assert mobile == {"device": "MOBILE", "sessions": 30, "avg_pages": 1.73, "bounce_pct": 26.7,
                      "product_view_pct": 73.3, "add_to_cart_pct": 13.3, "purchase_pct": 6.7}
    assert result["page_labels"]["PRODUCT"] == "상품 상세"


def test_compare_before_after(ds):
    result = run_tool(ds, "compare_before_after", {"date": "2026-11-05", "days": 7})
    assert result["before"]["sessions"] == 15 and result["before"]["paid_orders"] == 1
    assert result["after"]["sessions"] == 30 and result["after"]["paid_orders"] == 2
    assert result["change_pct"]["sessions"] == 100.0
    assert result["days_compared"] == {"before": 7.0, "after": 4.4}
    assert "4.4일뿐" in result["note"]
    red = next(p for p in result["products"] if p["name"] == "톡 RED SQUARE")
    assert red["before"]["orders"] == 1 and red["after"]["view_sessions"] == 12


@pytest.mark.parametrize("params", [
    {"date": "2026-12-01", "days": 7},   # 미래
    {"date": "2026-05-01", "days": 7},   # 원자료 이전
    {"date": "어제", "days": 7},
    {"date": "2026-11-05", "days": 2},
])
def test_compare_before_after_rejects_bad_input(ds, params):
    with pytest.raises(ToolInputError):
        run_tool(ds, "compare_before_after", params)


@pytest.mark.parametrize("name, params", [
    ("overview", {"days": 0}),
    ("overview", {"days": "7"}),
    ("funnel_by_source", {"days": 7, "dimension": "coupon", "limit": 5}),
    ("product_performance", {"days": 7, "sort_by": "views", "limit": 50}),
    ("drop_table", {}),
])
def test_invalid_input_is_rejected(ds, name, params):
    with pytest.raises(ToolInputError):
        run_tool(ds, name, params)


def test_tool_outputs_contain_no_visitor_or_session_ids(ds):
    """도구 결과에는 개인 단위 식별자를 넣지 않는다(집계만)."""
    import json
    for definition in TOOL_DEFINITIONS:
        text = json.dumps(run_tool(ds, definition["name"], _params_for(definition, days=30)), ensure_ascii=False,
                          default=str)
        assert "s-0" not in text and "v-0" not in text and "b1" not in text
