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
}
