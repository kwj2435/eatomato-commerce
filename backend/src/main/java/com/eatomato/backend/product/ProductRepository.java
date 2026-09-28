package com.eatomato.backend.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

	Optional<Product> findBySlug(String slug);

	@Query("select p.slug from Product p order by p.id")
	List<String> findAllSlugs();

	@Query("""
		select p from Product p
		where p.categoryCode = :category
		  and (:subcategory is null or p.subcategoryCode = :subcategory)
		""")
	List<Product> findByCategory(@Param("category") String category, @Param("subcategory") String subcategory,
		Sort sort);

	@Query("select p from Product p join p.badges b where b = :badge order by p.createdAt desc, p.id")
	List<Product> findByBadge(@Param("badge") ProductBadge badge, Pageable pageable);

	/** 상품명·옵션 요약 부분 일치 검색. 프론트 `matchesQuery` 와 같은 대상 필드. */
	@Query("""
		select p from Product p
		where lower(concat(p.name, ' ', coalesce(p.optionSummary, ''))) like lower(concat('%', :keyword, '%')) escape '\\'
		""")
	List<Product> search(@Param("keyword") String keyword, Sort sort);
}
