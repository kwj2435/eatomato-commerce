package com.eatomato.backend.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 스토어프론트용 조회는 모두 "판매 중(visible, 삭제 안 됨)" 상품만 본다.
 * 관리자 조회는 숨김 상품을 포함하되 삭제된 상품은 뺀다.
 */
public interface ProductRepository extends JpaRepository<Product, Long> {

	String ON_SALE = "p.visible = true and p.deletedAt is null";

	@Query("select p from Product p where p.slug = :slug and " + ON_SALE)
	Optional<Product> findOnSaleBySlug(@Param("slug") String slug);

	@Query("select p.slug from Product p where " + ON_SALE + " order by p.id")
	List<String> findAllSlugs();

	@Query("select p from Product p where p.categoryCode = :category"
		+ " and (:subcategory is null or p.subcategoryCode = :subcategory) and " + ON_SALE)
	List<Product> findByCategory(@Param("category") String category, @Param("subcategory") String subcategory,
		Sort sort);

	@Query("select p from Product p join p.badges b where b = :badge and " + ON_SALE
		+ " order by p.createdAt desc, p.id")
	List<Product> findByBadge(@Param("badge") ProductBadge badge, Pageable pageable);

	/** 상품명·옵션 요약 부분 일치 검색. */
	@Query("select p from Product p where " + ON_SALE
		+ " and lower(concat(p.name, ' ', coalesce(p.optionSummary, ''))) like lower(concat('%', :keyword, '%')) escape '\\'")
	List<Product> search(@Param("keyword") String keyword, Sort sort);

	// ── 관리자 ──────────────────────────────────────────────

	Optional<Product> findByIdAndDeletedAtIsNull(Long id);

	boolean existsBySlug(String slug);

	boolean existsBySlugAndIdNot(String slug, Long id);

	@Query("""
		select p from Product p
		where p.deletedAt is null
		  and (:category is null or p.categoryCode = :category)
		  and (:keyword is null or lower(p.name) like lower(concat('%', :keyword, '%'))
		       or lower(p.slug) like lower(concat('%', :keyword, '%')))
		""")
	Page<Product> searchForAdmin(@Param("keyword") String keyword, @Param("category") String category,
		Pageable pageable);

	@Query("select p from Product p where p.deletedAt is null order by p.name")
	List<Product> findAllForAdmin();

	long countByVisibleTrueAndDeletedAtIsNull();

	long countByVisibleFalseAndDeletedAtIsNull();

	/**
	 * 재고 차감. 재고가 충분할 때만 줄이고 바뀐 행 수(0 또는 1)를 돌려준다.
	 * 한 번의 UPDATE 로 확인과 차감을 같이 해 동시 주문에도 음수가 되지 않는다.
	 */
	@Modifying(flushAutomatically = true)
	@Query("update Product p set p.stockQuantity = p.stockQuantity - :quantity"
		+ " where p.id = :id and p.stockQuantity is not null and p.stockQuantity >= :quantity")
	int decreaseStock(@Param("id") Long id, @Param("quantity") int quantity);

	/** 재고 복원(주문 취소). 재고를 관리하지 않는 상품은 그대로 둔다. */
	@Modifying(flushAutomatically = true)
	@Query("update Product p set p.stockQuantity = p.stockQuantity + :quantity"
		+ " where p.id = :id and p.stockQuantity is not null")
	int increaseStock(@Param("id") Long id, @Param("quantity") int quantity);

	long countByStockQuantityLessThanEqualAndDeletedAtIsNull(int stock);

	/** 다른 상품의 함께 구매 목록에서 이 상품을 뺀다(삭제 시). */
	@Modifying
	@Query(value = "delete from product_related where related_product_id = :productId", nativeQuery = true)
	void deleteRelationsTo(@Param("productId") Long productId);
}
