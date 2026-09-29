package com.eatomato.backend.cart;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.eatomato.backend.product.Product;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

	@EntityGraph(attributePaths = "product")
	List<CartItem> findByMemberIdOrderByCreatedAtAscIdAsc(Long memberId);

	@EntityGraph(attributePaths = "product")
	List<CartItem> findByMemberIdAndIdIn(Long memberId, Collection<Long> ids);

	@EntityGraph(attributePaths = "product")
	List<CartItem> findByMemberIdAndSelectedTrue(Long memberId);

	Optional<CartItem> findByMemberIdAndProductAndOptionKey(Long memberId, Product product, String optionKey);

	Optional<CartItem> findByIdAndMemberId(Long id, Long memberId);

	void deleteByMemberId(Long memberId);

	void deleteByProduct(Product product);

	/** 결제가 끝난 주문 상품을 장바구니에서 지운다. */
	@org.springframework.data.jpa.repository.Modifying
	@org.springframework.data.jpa.repository.Query(
		"delete from CartItem c where c.memberId = :memberId and c.product.id = :productId and c.optionKey = :optionKey")
	void deleteByMemberIdAndProductIdAndOptionKey(
		@org.springframework.data.repository.query.Param("memberId") Long memberId,
		@org.springframework.data.repository.query.Param("productId") Long productId,
		@org.springframework.data.repository.query.Param("optionKey") String optionKey);
}
