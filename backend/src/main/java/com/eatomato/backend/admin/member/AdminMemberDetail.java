package com.eatomato.backend.admin.member;

import java.util.List;

import com.eatomato.backend.admin.order.AdminOrderResponse;
import com.eatomato.backend.member.dto.MemberResponse;

/** 관리자 회원 상세: 요약 + 회원 정보 전체 + 최근 주문 10건. */
public record AdminMemberDetail(AdminMemberSummary summary, MemberResponse profile, List<AdminOrderResponse> recentOrders) {
}
