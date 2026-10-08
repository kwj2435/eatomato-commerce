package com.eatomato.backend.point;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;

/**
 * 적립금. 잔액 변경과 내역 기록을 한 트랜잭션에서 같이 한다.
 * 적립: 배송완료(상품별 적립률), 후기 작성. 사용: 주문서(주문 생성 때 차감, 취소되면 반환).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {

	/** 후기 적립금. 상품 상세 후기 탭 안내 문구와 같다. */
	public static final int TEXT_REVIEW_REWARD = 200;
	public static final int PHOTO_REVIEW_REWARD = 500;

	private static final int HISTORY_LIMIT = 100;

	private final PointWalletRepository walletRepository;
	private final PointHistoryRepository historyRepository;

	public int balanceOf(Long memberId) {
		Integer balance = walletRepository.findBalance(memberId);
		return balance == null ? 0 : balance;
	}

	public PointsResponse summary(Long memberId) {
		List<PointsResponse.Entry> history = historyRepository
			.findByMemberIdOrderByCreatedAtDescIdDesc(memberId, PageRequest.of(0, HISTORY_LIMIT)).stream()
			.map(h -> new PointsResponse.Entry(String.valueOf(h.getId()), h.getType().name(), h.getAmount(),
				h.getBalanceAfter(), h.getReason(), Times.toOffset(h.getCreatedAt())))
			.toList();
		return new PointsResponse(balanceOf(memberId), history);
	}

	/** 적립(또는 사용분 반환). 0 이하면 아무것도 하지 않는다. */
	@Transactional
	public void earn(Long memberId, int amount, PointType type, String reason, Long orderId) {
		if (amount <= 0) {
			return;
		}
		ensureWallet(memberId);
		walletRepository.add(memberId, amount);
		historyRepository.save(new PointHistory(memberId, type, amount, balanceOf(memberId), reason, orderId));
	}

	/**
	 * 주문에 사용. 잔액이 모자라면 POINT_NOT_ENOUGH(트랜잭션 전체가 되돌아간다).
	 */
	@Transactional
	public void use(Long memberId, int amount, String reason, Long orderId) {
		if (amount <= 0) {
			return;
		}
		ensureWallet(memberId);
		if (walletRepository.subtract(memberId, amount) == 0) {
			throw new ApiException(ErrorCode.POINT_NOT_ENOUGH);
		}
		historyRepository.save(new PointHistory(memberId, PointType.ORDER_USE, -amount, balanceOf(memberId), reason,
			orderId));
	}

	private void ensureWallet(Long memberId) {
		if (!walletRepository.existsById(memberId)) {
			walletRepository.saveAndFlush(new PointWallet(memberId));
		}
	}

	/** 마이페이지 적립금: 잔액 + 최근 내역(최대 100건). */
	public record PointsResponse(int balance, List<Entry> history) {

		public record Entry(String id, String type, int amount, int balanceAfter, String reason,
			OffsetDateTime createdAt) {
		}
	}
}
