package com.eatomato.backend.point;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 적립금 잔액. 잔액은 엔티티로 고치지 않고 PointWalletRepository 의 조건부 UPDATE 로만 바꾼다
 * (동시에 두 주문이 같은 잔액을 쓰지 못하게).
 */
@Entity
@Table(name = "point_wallet")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointWallet {

	@Id
	private Long memberId;

	private int balance;

	PointWallet(Long memberId) {
		this.memberId = memberId;
		this.balance = 0;
	}
}
