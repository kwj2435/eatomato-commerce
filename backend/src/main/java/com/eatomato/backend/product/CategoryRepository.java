package com.eatomato.backend.product;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, String> {

	@EntityGraph(attributePaths = "subcategories")
	List<Category> findAllByOrderBySortOrder();
}
