package com.eatomato.backend.review;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.eatomato.backend.product.Product;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	Page<Review> findByProductOrderByBestDescCreatedAtDesc(Product product, Pageable pageable);

	long countByProduct(Product product);

	@EntityGraph(attributePaths = "product")
	List<Review> findByFeaturedTrueOrderByCreatedAtDescIdDesc(Pageable pageable);

	@EntityGraph(attributePaths = "product")
	List<Review> findByMemberIdOrderByCreatedAtDesc(Long memberId);

	/** 탈퇴한 회원의 후기는 남기고 작성자 표시만 바꾼다. */
	@Modifying
	@Query("update Review r set r.writerName = :writerName where r.memberId = :memberId")
	int renameWriter(@Param("memberId") Long memberId, @Param("writerName") String writerName);
}
