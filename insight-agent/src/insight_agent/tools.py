"""에이전트가 쓰는 분석 도구. 모두 읽기 전용이고, 집계 숫자와 표본 크기만 돌려준다(개인 단위 행은 돌려주지 않는다).

각 도구는 dict 를 돌려주고, 에이전트는 이를 JSON 으로 Claude 에게 넘긴다.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import pandas as pd

from .data import PAID_STATUSES, Dataset

# 이보다 적으면 결론을 내리기 어렵다고 도구 결과에 표시한다(주문이 적은 작은 쇼핑몰이라 중요).
MIN_SESSIONS = 30
MIN_ORDERS = 5
MIN_PRODUCT_VIEWS = 10

WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]


class ToolInputError(ValueError):
    """도구 입력이 잘못됨. 에이전트에게 is_error 결과로 돌려준다."""


# ── 공통 ─────────────────────────────────────────────────────────


def _days(params: dict) -> int:
    days = params.get("days")
    if not isinstance(days, int) or isinstance(days, bool) or not 1 <= days <= 90:
        raise ToolInputError("days 는 1~90 사이 정수여야 합니다.")
    return days


def _limit(params: dict, default: int = 10) -> int:
    limit = params.get("limit", default)
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 20:
        raise ToolInputError("limit 는 1~20 사이 정수여야 합니다.")
    return limit


def _choice(params: dict, key: str, allowed: tuple[str, ...]) -> str:
    value = params.get(key)
    if value not in allowed:
        raise ToolInputError(f"{key} 는 {', '.join(allowed)} 중 하나여야 합니다.")
    return value


def _in(df: pd.DataFrame, col: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    return df[(df[col] >= start) & (df[col] < end)]


def _pct(numerator: float, denominator: float) -> float | None:
    return round(float(numerator) / float(denominator) * 100, 1) if denominator else None


def _change_pct(current: float, previous: float) -> float | None:
    return round((float(current) - float(previous)) / float(previous) * 100, 1) if previous else None


def _period(start: pd.Timestamp, end: pd.Timestamp, days: int) -> dict:
    last = end - pd.Timedelta(microseconds=1)
    return {"from": start.date().isoformat(), "to": last.date().isoformat(), "days": days}


def _sample_note(sessions: int | None = None, orders: int | None = None) -> str | None:
    notes = []
    if sessions is not None and sessions < MIN_SESSIONS:
        notes.append(f"방문 {sessions}회로 {MIN_SESSIONS}회 미만")
    if orders is not None and orders < MIN_ORDERS:
        notes.append(f"결제 주문 {orders}건으로 {MIN_ORDERS}건 미만")
    return ("표본이 적어 결론을 내리기 어렵습니다: " + ", ".join(notes)) if notes else None


def _paid_orders(ds: Dataset, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    orders = _in(ds.orders, "orderedAt", start, end)
    return orders[orders["status"].isin(PAID_STATUSES)]


def _session_table(ds: Dataset, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    """기간 안 방문 한 행씩: 유입(캠페인·유입 경로·기기)과 단계(상품 조회·담기·결제하기·결제 완료)."""
    views = _in(ds.views, "at", start, end).sort_values("at")
    events = _in(ds.events, "at", start, end)
    session_ids = pd.Index(views["sessionId"]).union(pd.Index(events["sessionId"])).unique()
    columns = ["visitorId", "campaign", "referrer", "device", "product_view", "add_to_cart", "checkout", "purchase", "revenue"]
    if len(session_ids) == 0:
        return pd.DataFrame(columns=columns)

    # 유입 정보는 방문의 첫 조회에만 있다. 기간 앞에서 시작한 방문도 그 첫 조회에서 가져온다.
    starts = ds.views[ds.views["sessionStart"].astype(bool)].drop_duplicates("sessionId").set_index("sessionId")
    first_view = views.groupby("sessionId").first()
    first_event = events.groupby("sessionId").first()

    table = pd.DataFrame(index=session_ids)
    table["visitorId"] = first_view["visitorId"].combine_first(first_event["visitorId"])
    table["campaign"] = starts["campaign"].reindex(session_ids)
    table["referrer"] = starts["referrerHost"].reindex(session_ids)
    table["device"] = first_view["device"].reindex(session_ids).combine_first(starts["device"].reindex(session_ids))
    product_sessions = set(views.loc[views["pageType"] == "PRODUCT", "sessionId"])
    table["product_view"] = table.index.isin(product_sessions)
    for column, event_type in (("add_to_cart", "ADD_TO_CART"), ("checkout", "CHECKOUT_START"), ("purchase", "PURCHASE")):
        table[column] = table.index.isin(set(events.loc[events["type"] == event_type, "sessionId"]))
    purchases = events[events["type"] == "PURCHASE"]
    table["revenue"] = purchases.groupby("sessionId")["amount"].sum().reindex(session_ids).fillna(0)
    return table


def _funnel(sessions: pd.DataFrame) -> dict:
    n = len(sessions)
    product_view = int(sessions["product_view"].sum())
    cart = int(sessions["add_to_cart"].sum())
    checkout = int(sessions["checkout"].sum())
    purchase = int(sessions["purchase"].sum())
    return {
        "sessions": n,
        "product_view_sessions": product_view,
        "add_to_cart_sessions": cart,
        "checkout_sessions": checkout,
        "purchase_sessions": purchase,
        "tracked_revenue": int(sessions["revenue"].sum()),
        "conversion_pct": _pct(purchase, n),
        "view_to_cart_pct": _pct(cart, product_view),
        "checkout_to_purchase_pct": _pct(purchase, checkout),
    }


# ── 도구 ─────────────────────────────────────────────────────────


def _overview_metrics(ds: Dataset, start: pd.Timestamp, end: pd.Timestamp) -> dict:
    sessions = _session_table(ds, start, end)
    orders = _in(ds.orders, "orderedAt", start, end)
    paid = orders[orders["status"].isin(PAID_STATUSES)]
    cancelled = orders[orders["status"] == "CANCELLED"]
    revenue = int(paid["total"].sum())
    return {
        "visitors": int(sessions["visitorId"].nunique()),
        **_funnel(sessions),
        "paid_orders": len(paid),
        "revenue": revenue,
        "average_order_value": round(revenue / len(paid)) if len(paid) else None,
        "refunded_orders": int(cancelled["paidAt"].notna().sum()),
        "unpaid_cancelled_orders": int(cancelled["paidAt"].isna().sum()),
    }


def overview(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    start, end = ds.window(days)
    current = _overview_metrics(ds, start, end)
    result: dict[str, Any] = {"period": _period(start, end, days), "current": current}
    previous_window = ds.previous_window(days)
    if previous_window:
        previous = _overview_metrics(ds, *previous_window)
        result["previous"] = previous
        result["change_pct"] = {
            key: _change_pct(current[key], previous[key])
            for key in ("visitors", "sessions", "purchase_sessions", "paid_orders", "revenue")
        }
    else:
        result["previous"] = None
        result["comparison_note"] = "직전 같은 기간의 원자료가 없어 비교하지 않았습니다."
    result["note"] = _sample_note(current["sessions"], current["paid_orders"])
    result["definitions"] = (
        "sessions 이하 단계는 브라우저 방문 기록 기준(관리자 제외), paid_orders·revenue 는 실제 결제 주문 기준이라 서로 다를 수 있음"
    )
    return result


_DIMENSIONS = {
    "campaign": ("campaign", "(캠페인 링크 없음)"),
    "referrer": ("referrer", "(직접 방문)"),
    "device": ("device", "(알 수 없음)"),
}


def funnel_by_source(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    dimension = _choice(params, "dimension", tuple(_DIMENSIONS))
    limit = _limit(params)
    start, end = ds.window(days)
    sessions = _session_table(ds, start, end)
    column, empty_label = _DIMENSIONS[dimension]
    keys = sessions[column].fillna(empty_label) if len(sessions) else pd.Series(dtype=str)
    rows = [{"group": str(key), **_funnel(group)} for key, group in sessions.groupby(keys)]
    rows.sort(key=lambda r: (-r["sessions"], r["group"]))
    return {
        "period": _period(start, end, days),
        "dimension": dimension,
        "total": _funnel(sessions),
        "groups": rows[:limit],
        "other_groups": max(0, len(rows) - limit),
        "note": _sample_note(len(sessions)),
        "group_note": f"그룹별 방문이 {MIN_SESSIONS}회 미만이면 전환율 차이는 우연일 수 있음",
    }


def product_performance(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    sort_by = _choice(params, "sort_by", ("views", "revenue", "low_conversion"))
    limit = _limit(params)
    start, end = ds.window(days)

    views = _in(ds.views, "at", start, end)
    views = views[(views["pageType"] == "PRODUCT") & views["productId"].notna()]
    view_sessions = views.groupby("productId")["sessionId"].nunique().rename("view_sessions")

    events = _in(ds.events, "at", start, end)
    carts = events[(events["type"] == "ADD_TO_CART") & events["productId"].notna()]
    cart_sessions = carts.groupby("productId")["sessionId"].nunique().rename("cart_sessions")

    paid_index = _paid_orders(ds, start, end).index
    items = ds.items[ds.items["orderIndex"].isin(paid_index)].assign(
        revenue=lambda d: d["quantity"] * d["unitPrice"])
    sold = items.groupby("productId").agg(orders=("orderIndex", "nunique"), quantity=("quantity", "sum"),
                                          revenue=("revenue", "sum"))

    stats = pd.concat([view_sessions, cart_sessions, sold], axis=1).fillna(0)
    stats.index = stats.index.astype("int64")
    catalog = ds.products.set_index("id")
    rows = []
    for product_id, s in stats.iterrows():
        p = catalog.loc[product_id] if product_id in catalog.index else None
        price = int(p["price"]) if p is not None else None
        sale = p["salePrice"] if p is not None and pd.notna(p["salePrice"]) else None
        rows.append({
            "product_id": int(product_id),
            "name": str(p["name"]) if p is not None else "(삭제된 상품)",
            "view_sessions": int(s["view_sessions"]),
            "cart_sessions": int(s["cart_sessions"]),
            "orders": int(s["orders"]),
            "quantity": int(s["quantity"]),
            "revenue": int(s["revenue"]),
            "view_to_cart_pct": _pct(s["cart_sessions"], s["view_sessions"]),
            "view_to_order_pct": _pct(s["orders"], s["view_sessions"]),
            "price": price,
            "sale_price": int(sale) if sale is not None else None,
            "discount_pct": round((price - int(sale)) / price * 100) if sale is not None and price else None,
            "stock": int(p["stock"]) if p is not None and pd.notna(p["stock"]) else None,
            "visible": bool(p["visible"]) if p is not None else False,
            "rating": float(p["rating"]) if p is not None and pd.notna(p["rating"]) else None,
            "review_count": int(p["reviewCount"]) if p is not None else 0,
        })

    if sort_by == "views":
        rows.sort(key=lambda r: (-r["view_sessions"], -r["revenue"]))
    elif sort_by == "revenue":
        rows.sort(key=lambda r: (-r["revenue"], -r["view_sessions"]))
    else:
        rows = [r for r in rows if r["view_sessions"] >= MIN_PRODUCT_VIEWS]
        rows.sort(key=lambda r: (r["view_to_order_pct"] or 0, -r["view_sessions"]))
    return {
        "period": _period(start, end, days),
        "sort_by": sort_by,
        "products": rows[:limit],
        "other_products": max(0, len(rows) - limit),
        "note": (f"low_conversion 은 상품 조회 방문 {MIN_PRODUCT_VIEWS}회 이상인 상품만 비교"
                 if sort_by == "low_conversion" else None),
    }


def time_patterns(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    start, end = ds.window(days)
    views = _in(ds.views, "at", start, end)
    session_start = views.groupby("sessionId")["at"].min()
    paid = _paid_orders(ds, start, end)

    def by(series: pd.Series, key: Callable[[pd.Series], pd.Series]) -> dict:
        return {int(k): int(v) for k, v in key(series).value_counts().items()}

    sessions_wd = by(session_start, lambda s: s.dt.day_of_week)
    orders_wd = by(paid["orderedAt"], lambda s: s.dt.day_of_week)
    sessions_hr = by(session_start, lambda s: s.dt.hour)
    orders_hr = by(paid["orderedAt"], lambda s: s.dt.hour)
    hours = sorted(set(sessions_hr) | set(orders_hr))

    def top(counts: dict, n: int = 3) -> list[int]:
        return [h for h, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:n]]

    return {
        "period": _period(start, end, days),
        "by_weekday": [{"weekday": WEEKDAYS[d], "sessions": sessions_wd.get(d, 0), "paid_orders": orders_wd.get(d, 0)}
                       for d in range(7)],
        "by_hour": [{"hour": h, "sessions": sessions_hr.get(h, 0), "paid_orders": orders_hr.get(h, 0)} for h in hours],
        "peak_hours_by_sessions": top(sessions_hr),
        "peak_hours_by_orders": top(orders_hr),
        "note": _sample_note(len(session_start), len(paid)),
    }


def customer_behavior(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    start, end = ds.window(days)
    orders = _in(ds.orders, "orderedAt", start, end)
    paid = orders[orders["status"].isin(PAID_STATUSES)]
    members = paid[~paid["guest"].astype(bool) & paid["buyer"].notna()]
    per_buyer = members.groupby("buyer").size()
    earlier = ds.orders[(ds.orders["orderedAt"] < start) & ds.orders["status"].isin(PAID_STATUSES)]
    returning = set(per_buyer.index) & set(earlier["buyer"].dropna())

    with_coupon = paid[paid["couponDiscount"] > 0]
    without_coupon = paid[paid["couponDiscount"] <= 0]
    items = ds.items[ds.items["orderIndex"].isin(paid.index)]
    cancelled = orders[orders["status"] == "CANCELLED"]

    def aov(df: pd.DataFrame) -> int | None:
        return round(float(df["total"].mean())) if len(df) else None

    return {
        "period": _period(start, end, days),
        "paid_orders": len(paid),
        "member_orders": len(members),
        "guest_orders": int(paid["guest"].astype(bool).sum()),
        "unique_member_buyers": int(per_buyer.size),
        "buyers_with_2plus_orders_in_period": int((per_buyer >= 2).sum()),
        "returning_buyers": len(returning),
        "returning_note": "기간 전에도 결제한 적이 있는 회원(원자료 범위 안에서만 확인). 비회원은 재구매를 알 수 없음",
        "coupon_orders": len(with_coupon),
        "aov_with_coupon": aov(with_coupon),
        "aov_without_coupon": aov(without_coupon),
        "point_orders": int((paid["pointUsed"] > 0).sum()),
        "items_per_order": round(float(items["quantity"].sum()) / len(paid), 2) if len(paid) else None,
        "refunded_orders": int(cancelled["paidAt"].notna().sum()),
        "unpaid_cancelled_orders": int(cancelled["paidAt"].isna().sum()),
        "awaiting_payment_orders": int(orders["status"].isin({"PENDING_PAYMENT", "AWAITING_DEPOSIT"}).sum()),
        "note": _sample_note(orders=len(paid)),
    }


def review_signals(ds: Dataset, params: dict) -> dict:
    days = _days(params)
    start, end = ds.window(days)
    reviews = _in(ds.reviews, "at", start, end)
    names = ds.products.set_index("id")["name"]
    by_product = (reviews.groupby("productId")
                  .agg(count=("rating", "size"), average=("rating", "mean"), photos=("photo", "sum"))
                  .sort_values(["count", "average"], ascending=[False, True]))
    low = reviews[reviews["rating"] <= 2].sort_values("at", ascending=False).head(5)
    return {
        "period": _period(start, end, days),
        "reviews": len(reviews),
        "average_rating": round(float(reviews["rating"].mean()), 2) if len(reviews) else None,
        "photo_review_pct": _pct(reviews["photo"].astype(bool).sum(), len(reviews)),
        "by_product": [
            {"product_id": int(pid), "name": str(names.get(pid, "(삭제된 상품)")), "count": int(r["count"]),
             "average_rating": round(float(r["average"]), 2), "photo_reviews": int(r["photos"])}
            for pid, r in by_product.head(10).iterrows()
        ],
        "low_rating_excerpts": [
            {"name": str(names.get(r["productId"], "(삭제된 상품)")), "rating": int(r["rating"]),
             "excerpt": str(r["excerpt"]), "date": r["at"].date().isoformat()}
            for _, r in low.iterrows()
        ],
    }


# ── Claude 에게 주는 도구 정의 ──────────────────────────────────────

_DAYS_SCHEMA = {"type": "integer", "description": "오늘을 포함한 최근 며칠(1~90). 주간이면 7, 월간이면 28 을 권장."}
_LIMIT_SCHEMA = {"type": "integer", "description": "돌려받을 행 수(1~20)."}

TOOLS: dict[str, tuple[Callable[[Dataset, dict], dict], dict]] = {
    "overview": (overview, {
        "description": "기간 전체 성과 요약: 방문자·방문 수, 상품 조회→담기→결제하기→결제 완료 단계별 방문 수와 전환율, 결제 주문 수·매출·객단가, "
                       "환불·결제 전 취소. 직전 같은 길이 기간과의 변화율도 준다. 분석을 시작할 때 먼저 쓴다.",
        "input_schema": {"type": "object", "properties": {"days": _DAYS_SCHEMA}, "required": ["days"],
                         "additionalProperties": False},
    }),
    "funnel_by_source": (funnel_by_source, {
        "description": "유입별 구매 단계 비교. dimension=campaign 은 링크의 ?from= 값(인스타 게시물 등), referrer 는 유입 사이트(직접 방문 포함), "
                       "device 는 MOBILE·TABLET·DESKTOP. 어떤 채널·게시물이 실제 구매로 이어졌는지 볼 때 쓴다.",
        "input_schema": {"type": "object", "properties": {
            "days": _DAYS_SCHEMA,
            "dimension": {"type": "string", "enum": ["campaign", "referrer", "device"]},
            "limit": _LIMIT_SCHEMA,
        }, "required": ["days", "dimension", "limit"], "additionalProperties": False},
    }),
    "product_performance": (product_performance, {
        "description": "상품별 조회 방문·담기 방문·결제 주문·매출과 전환율, 가격·할인율·재고·평점·후기 수. sort_by=views(많이 본 순), "
                       "revenue(매출 순), low_conversion(조회는 충분한데 구매 전환이 낮은 순 — 상세 페이지·가격 점검 후보).",
        "input_schema": {"type": "object", "properties": {
            "days": _DAYS_SCHEMA,
            "sort_by": {"type": "string", "enum": ["views", "revenue", "low_conversion"]},
            "limit": _LIMIT_SCHEMA,
        }, "required": ["days", "sort_by", "limit"], "additionalProperties": False},
    }),
    "time_patterns": (time_patterns, {
        "description": "요일별·시간대별(KST) 방문 시작 수와 결제 주문 수, 방문·주문이 많은 시간 상위 3개. 게시물·쿠폰 발송 시간을 정할 때 쓴다.",
        "input_schema": {"type": "object", "properties": {"days": _DAYS_SCHEMA}, "required": ["days"],
                         "additionalProperties": False},
    }),
    "customer_behavior": (customer_behavior, {
        "description": "구매 고객 행동: 회원/비회원 주문, 기간 중 2회 이상 산 회원, 이전에도 산 재방문 구매 회원, 쿠폰 사용 주문과 쿠폰 유무별 객단가, "
                       "적립금 사용, 주문당 상품 수, 환불·결제 전 취소·결제 대기.",
        "input_schema": {"type": "object", "properties": {"days": _DAYS_SCHEMA}, "required": ["days"],
                         "additionalProperties": False},
    }),
    "review_signals": (review_signals, {
        "description": "후기 수·평균 별점·포토 후기 비율, 상품별 후기 요약, 별점 2점 이하 후기 본문 앞부분(최대 5개). 상품 불만·개선점을 볼 때 쓴다.",
        "input_schema": {"type": "object", "properties": {"days": _DAYS_SCHEMA}, "required": ["days"],
                         "additionalProperties": False},
    }),
}

TOOL_DEFINITIONS: list[dict] = [{"name": name, **spec} for name, (_, spec) in TOOLS.items()]


def run_tool(ds: Dataset, name: str, params: dict) -> dict:
    if name not in TOOLS:
        raise ToolInputError(f"없는 도구입니다: {name}")
    if not isinstance(params, dict):
        raise ToolInputError("입력은 객체여야 합니다.")
    function, _ = TOOLS[name]
    return function(ds, params)
