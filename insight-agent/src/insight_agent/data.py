"""백엔드 원자료(InsightDataset JSON)를 pandas 표로 바꾼다. 시각은 모두 KST(시간대 없는 값)."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

# 결제가 끝난 주문(매출로 세는 상태). 백엔드 OrderStatus.PAID_STATES 와 같다.
PAID_STATUSES = {"PAID", "PREPARING", "SHIPPING", "DELIVERED"}

_COLUMNS = {
    "pageViews": ["visitorId", "sessionId", "at", "pageType", "productId", "sessionStart", "referrerHost", "campaign", "device"],
    "events": ["visitorId", "sessionId", "type", "productId", "amount", "at"],
    "orders": ["orderedAt", "paidAt", "status", "total", "subtotal", "shippingFee", "couponDiscount", "pointUsed", "guest", "buyer"],
    "items": ["orderIndex", "productId", "productName", "quantity", "unitPrice"],
    "products": ["id", "name", "category", "subcategory", "price", "salePrice", "stock", "visible", "rating", "reviewCount", "salesCount", "createdAt"],
    "reviews": ["productId", "rating", "photo", "excerpt", "at"],
}


def _frame(rows: list[dict], key: str, time_cols: tuple[str, ...] = ()) -> pd.DataFrame:
    df = pd.DataFrame(rows, columns=_COLUMNS[key])
    for col in time_cols:
        df[col] = pd.to_datetime(df[col], errors="coerce")
    return df


@dataclass
class Dataset:
    start: pd.Timestamp
    end: pd.Timestamp
    views: pd.DataFrame
    events: pd.DataFrame
    orders: pd.DataFrame
    items: pd.DataFrame
    products: pd.DataFrame
    reviews: pd.DataFrame

    @classmethod
    def from_json(cls, raw: dict) -> "Dataset":
        orders_raw = raw.get("orders", [])
        items = [
            {"orderIndex": i, **item}
            for i, order in enumerate(orders_raw)
            for item in order.get("items", [])
        ]
        orders = _frame([{k: v for k, v in o.items() if k != "items"} for o in orders_raw], "orders", ("orderedAt", "paidAt"))
        return cls(
            start=pd.Timestamp(raw["from"]),
            end=pd.Timestamp(raw["to"]),
            views=_frame(raw.get("pageViews", []), "pageViews", ("at",)),
            events=_frame(raw.get("events", []), "events", ("at",)),
            orders=orders,
            items=_frame(items, "items"),
            products=_frame(raw.get("products", []), "products", ("createdAt",)),
            reviews=_frame(raw.get("reviews", []), "reviews", ("at",)),
        )

    def window(self, days: int) -> tuple[pd.Timestamp, pd.Timestamp]:
        """오늘을 포함한 최근 days 일. 모든 기간은 [시작, 끝) 이라 끝은 '지금' 바로 뒤로 둔다."""
        start = self.end.normalize() - pd.Timedelta(days=days - 1)
        return max(start, self.start), self.end + pd.Timedelta(microseconds=1)

    def previous_window(self, days: int) -> tuple[pd.Timestamp, pd.Timestamp] | None:
        """바로 앞 같은 길이 기간. 원자료가 그만큼 없으면 None(비교하지 않는다)."""
        start, _ = self.window(days)
        prev_start = start - pd.Timedelta(days=days)
        if prev_start < self.start:
            return None
        return prev_start, start

    def summary(self) -> dict:
        """에이전트에게 처음 알려 주는 데이터 범위."""
        return {
            "from": self.start.isoformat(),
            "to": self.end.isoformat(),
            "page_views": len(self.views),
            "sessions": int(self.views["sessionId"].nunique()),
            "events": len(self.events),
            "orders": len(self.orders),
            "paid_orders": int(self.orders["status"].isin(PAID_STATUSES).sum()),
            "products": len(self.products),
            "reviews": len(self.reviews),
        }
