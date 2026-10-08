package com.eatomato.backend.coupon;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberCouponRepository extends JpaRepository<MemberCoupon, Long> {

	@Query("select mc from MemberCoupon mc join fetch mc.coupon where mc.memberId = :memberId"
		+ " order by mc.issuedAt desc, mc.id desc")
	List<MemberCoupon> findMine(@Param("memberId") Long memberId);

	@Query("select mc from MemberCoupon mc join fetch mc.coupon where mc.id = :id and mc.memberId = :memberId")
	Optional<MemberCoupon> findMine(@Param("id") Long id, @Param("memberId") Long memberId);

	/** 이미 이 쿠폰을 받은 회원(같은 쿠폰은 한 사람에게 한 장). */
	@Query("select mc.memberId from MemberCoupon mc where mc.coupon.id = :couponId and mc.memberId in :memberIds")
	List<Long> findHolders(@Param("couponId") Long couponId, @Param("memberIds") Collection<Long> memberIds);

	long countByCouponId(Long couponId);

	long countByCouponIdAndUsedAtIsNotNull(Long couponId);

	/** 주문에 사용. 이미 썼으면 0 을 돌려준다(두 주문에 같은 쿠폰을 쓰지 못하게). */
	@Modifying(flushAutomatically = true)
	@Query("update MemberCoupon mc set mc.usedAt = :now, mc.orderId = :orderId"
		+ " where mc.id = :id and mc.memberId = :memberId and mc.usedAt is null")
	int markUsed(@Param("id") Long id, @Param("memberId") Long memberId, @Param("orderId") Long orderId,
		@Param("now") LocalDateTime now);

	/** 주문 취소: 그 주문에 쓴 쿠폰을 다시 쓸 수 있게 한다(기한은 그대로). */
	@Modifying(flushAutomatically = true)
	@Query("update MemberCoupon mc set mc.usedAt = null, mc.orderId = null where mc.orderId = :orderId")
	int restore(@Param("orderId") Long orderId);
}
