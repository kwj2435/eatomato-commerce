package com.eatomato.backend.member;

import java.time.Period;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.auth.token.RefreshTokenService;
import com.eatomato.backend.cart.CartItemRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.order.OrderRepository;
import com.eatomato.backend.order.OrderStatus;
import com.eatomato.backend.review.ReviewRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회원 탈퇴.
 *
 * 회원 행은 주문·결제·적립금 기록이 참조하고, 주문·결제 기록은 전자상거래법상 5년 보관해야 해서 지우지 않는다.
 * 대신 회원 정보를 지우고(Member.withdraw) 로그인을 막는다. 쿠폰·적립금은 쓸 수 없게 되어 소멸한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberWithdrawalService {

	/** 이 상태의 주문이 있으면 탈퇴를 막는다(결제·배송이 끝나지 않은 주문). */
	static final Set<OrderStatus> IN_PROGRESS = EnumSet.of(
		OrderStatus.PENDING_PAYMENT, OrderStatus.AWAITING_DEPOSIT, OrderStatus.PAID, OrderStatus.PREPARING,
		OrderStatus.SHIPPING);

	/** 탈퇴한 소셜 계정 해시를 두는 기간. */
	static final Period KEEP_WITHDRAWN_SOCIAL = Period.ofYears(1);

	static final String WITHDRAWN_WRITER = "탈퇴한 회원";

	private final MemberRepository memberRepository;
	private final WithdrawnSocialAccountRepository withdrawnSocialAccountRepository;
	private final OrderRepository orderRepository;
	private final ReviewRepository reviewRepository;
	private final CartItemRepository cartItemRepository;
	private final RefreshTokenService refreshTokenService;

	@Transactional
	public void withdraw(Long memberId) {
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ApiException(ErrorCode.MEMBER_NOT_FOUND));
		if (member.isAdmin()) {
			throw new ApiException(ErrorCode.WITHDRAW_ADMIN);
		}
		if (orderRepository.existsByMemberIdAndStatusIn(memberId, IN_PROGRESS)) {
			throw new ApiException(ErrorCode.WITHDRAW_ORDER_IN_PROGRESS);
		}
		if (member.getKakaoId() != null) {
			remember(WithdrawnSocialAccount.KAKAO, String.valueOf(member.getKakaoId()));
		}
		if (member.getNaverId() != null) {
			remember(WithdrawnSocialAccount.NAVER, member.getNaverId());
		}
		reviewRepository.renameWriter(memberId, WITHDRAWN_WRITER);
		cartItemRepository.deleteByMemberId(memberId);
		refreshTokenService.revokeAll(memberId);
		member.withdraw();
		log.info("회원 탈퇴: id={}", memberId);
	}

	/** 탈퇴했던 소셜 계정인지. 다시 가입할 때 신규가입 쿠폰을 줄지 정한다. */
	@Transactional(readOnly = true)
	public boolean wasWithdrawn(String provider, String socialId) {
		return withdrawnSocialAccountRepository.existsByProviderAndIdHash(provider, WithdrawnSocialAccount.hash(provider, socialId));
	}

	/** 매일 새벽 보관 기간이 지난 탈퇴 소셜 계정 해시를 지운다. */
	@Scheduled(cron = "0 40 4 * * *", zone = "Asia/Seoul")
	@Transactional
	public void cleanUp() {
		int deleted = withdrawnSocialAccountRepository.deleteWithdrawnBefore(Times.now().minus(KEEP_WITHDRAWN_SOCIAL));
		log.info("탈퇴 소셜 계정 기록 정리: {}건", deleted);
	}

	private void remember(String provider, String socialId) {
		String hash = WithdrawnSocialAccount.hash(provider, socialId);
		if (!withdrawnSocialAccountRepository.existsByProviderAndIdHash(provider, hash)) {
			withdrawnSocialAccountRepository.save(new WithdrawnSocialAccount(provider, hash));
		}
	}
}
