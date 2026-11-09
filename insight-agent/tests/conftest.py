"""답을 아는 작은 원자료. 기준 시각은 2026-11-09(월) 10:00 KST.

이번 주(최근 7일, 11-03 ~ 11-09)
  - 캠페인 post-a(인스타그램): 방문 10회, 모두 상품1 조회, 3회 담기, 2회 결제하기, 2회 결제 완료(각 15,000원)
  - 캠페인 없음(직접 방문): 방문 20회, 그중 12회 상품2 조회, 1회 담기, 결제 없음
  - 결제 주문 2건(상품1, 회원 b1·b2, b2 는 쿠폰 2,000원), 결제 전 취소 1건, 환불 1건
  - 후기: 상품1 별점 1점(본문 있음), 상품2 별점 5점(사진)
지난주(8~14일 전)
  - 직접 방문 15회, 1회 결제 완료(16,000원), 결제 주문 1건(상품2, 회원 b1 → 이번 주 b1 은 재구매 회원)
"""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest

NOW = datetime(2026, 11, 9, 10, 0)


def _iso(dt: datetime) -> str:
    return dt.isoformat()


def build_raw() -> dict:
    views, events, orders = [], [], []

    def session(i: int, at: datetime, campaign=None, referrer=None, product=None):
        sid = f"s-{i:03d}"
        views.append({"visitorId": f"v-{i:03d}", "sessionId": sid, "at": _iso(at), "pageType": "HOME", "productId": None,
                      "sessionStart": True, "referrerHost": referrer, "campaign": campaign, "device": "MOBILE"})
        if product:
            views.append({"visitorId": f"v-{i:03d}", "sessionId": sid, "at": _iso(at + timedelta(minutes=1)),
                          "pageType": "PRODUCT", "productId": product, "sessionStart": False, "referrerHost": None,
                          "campaign": None, "device": "MOBILE"})
        return sid

    def event(sid: str, kind: str, at: datetime, product=None, amount=None):
        events.append({"visitorId": "v-" + sid[2:], "sessionId": sid, "type": kind, "productId": product,
                       "amount": amount, "at": _iso(at)})

    this_week = NOW - timedelta(days=2)  # 11-07(토)
    for i in range(10):
        sid = session(i, this_week + timedelta(hours=i), "post-a", "instagram.com", product=1)
        if i < 3:
            event(sid, "ADD_TO_CART", this_week + timedelta(hours=i, minutes=2), product=1, amount=1)
        if i < 2:
            event(sid, "CHECKOUT_START", this_week + timedelta(hours=i, minutes=3))
            event(sid, "PURCHASE", this_week + timedelta(hours=i, minutes=4), amount=15000)
    for i in range(10, 30):
        sid = session(i, this_week + timedelta(hours=i - 10, minutes=30), product=2 if i < 22 else None)
        if i == 10:
            event(sid, "ADD_TO_CART", this_week + timedelta(hours=0, minutes=32), product=2, amount=1)

    last_week = NOW - timedelta(days=10)
    for i in range(30, 45):
        sid = session(i, last_week + timedelta(hours=i - 30))
        if i == 30:
            event(sid, "PURCHASE", last_week + timedelta(minutes=5), amount=16000)

    def order(at, status, total, buyer, product, price, coupon=0, paid=True):
        orders.append({"orderedAt": _iso(at), "paidAt": _iso(at) if paid else None, "status": status, "total": total,
                       "subtotal": price, "shippingFee": 0, "couponDiscount": coupon, "pointUsed": 0,
                       "guest": buyer is None, "buyer": buyer,
                       "items": [{"productId": product, "productName": f"상품{product}", "quantity": 1, "unitPrice": price}]})

    order(this_week + timedelta(minutes=4), "PAID", 15000, "b1", 1, 15000)
    order(this_week + timedelta(hours=1, minutes=4), "DELIVERED", 13000, "b2", 1, 15000, coupon=2000)
    order(this_week + timedelta(hours=3), "CANCELLED", 16000, "b3", 2, 16000, paid=False)
    order(this_week + timedelta(hours=4), "CANCELLED", 16000, "b4", 2, 16000, paid=True)
    order(last_week + timedelta(minutes=5), "DELIVERED", 16000, "b1", 2, 16000)

    products = [
        {"id": 1, "name": "톡 CREAM ROUND", "category": "phone-case", "subcategory": None, "price": 15000,
         "salePrice": None, "stock": 5, "visible": True, "rating": 3.0, "reviewCount": 1, "salesCount": 2,
         "createdAt": "2026-09-01T00:00:00"},
        {"id": 2, "name": "톡 RED SQUARE", "category": "phone-case", "subcategory": None, "price": 16000,
         "salePrice": 12800, "stock": None, "visible": True, "rating": 5.0, "reviewCount": 1, "salesCount": 1,
         "createdAt": "2026-09-01T00:00:00"},
    ]
    reviews = [
        {"productId": 1, "rating": 1, "photo": False, "excerpt": "케이스가 금방 깨질 것 같아요", "at": _iso(this_week + timedelta(hours=8))},
        {"productId": 2, "rating": 5, "photo": True, "excerpt": "색이 예뻐요", "at": _iso(this_week + timedelta(hours=9))},
    ]
    return {"from": _iso(datetime(2026, 8, 12)), "to": _iso(NOW), "pageViews": views, "events": events,
            "orders": orders, "products": products, "reviews": reviews}


@pytest.fixture
def raw() -> dict:
    return build_raw()


@pytest.fixture
def ds(raw):
    from insight_agent.data import Dataset
    return Dataset.from_json(raw)
