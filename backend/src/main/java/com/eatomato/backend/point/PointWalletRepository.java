package com.eatomato.backend.point;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PointWalletRepository extends JpaRepository<PointWallet, Long> {

	@Modifying(flushAutomatically = true)
	@Query("update PointWallet w set w.balance = w.balance + :amount where w.memberId = :memberId")
	int add(@Param("memberId") Long memberId, @Param("amount") int amount);

	/** 잔액이 모자라면 0 을 돌려준다(차감하지 않음). */
	@Modifying(flushAutomatically = true)
	@Query("update PointWallet w set w.balance = w.balance - :amount where w.memberId = :memberId and w.balance >= :amount")
	int subtract(@Param("memberId") Long memberId, @Param("amount") int amount);

	@Query("select w.balance from PointWallet w where w.memberId = :memberId")
	Integer findBalance(@Param("memberId") Long memberId);
}
