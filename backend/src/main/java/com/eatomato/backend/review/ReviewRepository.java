package com.eatomato.backend.review;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.eatomato.backend.product.Product;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	Page<Review> findByProductOrderByBestDescCreatedAtDesc(Product product, Pageable pageable);

	long countByProduct(Product product);

	@EntityGraph(attributePaths = "product")
	List<Review> findByFeaturedTrueOrderByCreatedAtDescIdDesc(Pageable pageable);

	@EntityGraph(attributePaths = "product")
	List<Review> findByMemberIdOrderByCreatedAtDesc(Long memberId);
}
