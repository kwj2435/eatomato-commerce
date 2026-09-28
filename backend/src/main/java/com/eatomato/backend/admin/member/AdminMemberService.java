package com.eatomato.backend.admin.member;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.admin.common.Keywords;
import com.eatomato.backend.admin.common.PageResponse;
import com.eatomato.backend.admin.order.AdminOrderResponse;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.member.MemberRole;
import com.eatomato.backend.member.dto.MemberResponse;
import com.eatomato.backend.order.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

	private final MemberRepository memberRepository;
	private final OrderRepository orderRepository;

	public PageResponse<AdminMemberSummary> list(String keyword, String role, Pageable pageable) {
		Page<Member> page = memberRepository.searchForAdmin(
			Keywords.normalize(keyword), role == null || role.isBlank() ? null : MemberRole.valueOf(role), pageable);
		Map<Long, long[]> stats = orderStats(page.getContent().stream().map(Member::getId).toList());
		return PageResponse.of(page, page.getContent().stream()
			.map(member -> {
				long[] stat = stats.getOrDefault(member.getId(), new long[] {0, 0});
				return AdminMemberSummary.of(member, stat[0], stat[1]);
			})
			.toList());
	}

	public AdminMemberDetail get(Long id) {
		Member member = find(id);
		long[] stat = orderStats(List.of(id)).getOrDefault(id, new long[] {0, 0});
		List<AdminOrderResponse> orders = orderRepository.findTop10ByMemberIdOrderByOrderedAtDescIdDesc(id).stream()
			.map(order -> AdminOrderResponse.of(order, member))
			.toList();
		return new AdminMemberDetail(AdminMemberSummary.of(member, stat[0], stat[1]), MemberResponse.from(member), orders);
	}

	@Transactional
	public AdminMemberDetail update(Long adminId, Long id, AdminMemberUpdateRequest request) {
		Member member = find(id);
		boolean changesAccess = request.role() != null || request.enabled() != null;
		if (changesAccess && adminId.equals(id)) {
			// 마지막 관리자가 스스로 권한을 내려 관리자 화면에 아무도 못 들어오는 상황을 막는다.
			throw new ApiException(ErrorCode.CANNOT_CHANGE_SELF);
		}
		if (request.grade() != null) {
			member.changeGrade(request.grade().trim());
		}
		if (request.role() != null) {
			member.changeRole(MemberRole.valueOf(request.role()));
		}
		if (request.enabled() != null) {
			member.changeEnabled(request.enabled());
		}
		return get(id);
	}

	private Member find(Long id) {
		return memberRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.MEMBER_NOT_FOUND));
	}

	/** 회원 id → {주문 수, 결제 합계}. */
	private Map<Long, long[]> orderStats(List<Long> memberIds) {
		Map<Long, long[]> stats = new HashMap<>();
		if (memberIds.isEmpty()) {
			return stats;
		}
		for (Object[] row : orderRepository.summarizeByMembers(memberIds)) {
			stats.put((Long) row[0], new long[] {((Number) row[1]).longValue(), ((Number) row[2]).longValue()});
		}
		return stats;
	}
}
