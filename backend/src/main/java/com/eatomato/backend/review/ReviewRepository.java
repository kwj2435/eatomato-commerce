package com.eatomato.backend.review;

import java.time.LocalDateTime;
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

	/** since 이후 별점이 maxRating 이하인 후기, 최신순. */
	@EntityGraph(attributePaths = "product")
	List<Review> findByRatingLessThanEqualAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(int maxRating,
		LocalDateTime since);

	/** from 이후 후기(상품 포함). 마케팅 인사이트 원자료. */
	@EntityGraph(attributePaths = "product")
	List<Review> findByCreatedAtGreaterThanEqual(LocalDateTime from);

	/** 상품별 (상품 id, 후기 수). */
	@Query("select r.product.id, count(r) from Review r group by r.product.id")
	List<Object[]> countGroupByProduct();

	/** 탈퇴한 회원의 후기는 남기고 작성자 표시만 바꾼다. */
	@Modifying
	@Query("update Review r set r.writerName = :writerName where r.memberId = :memberId")
	int renameWriter(@Param("memberId") Long memberId, @Param("writerName") String writerName);
}
