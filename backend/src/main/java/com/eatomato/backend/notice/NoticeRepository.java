package com.eatomato.backend.notice;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

	List<Notice> findByTitleContainingIgnoreCase(String keyword, Sort sort);

	@Query("select n.id from Notice n order by n.id")
	List<Long> findAllIds();
}
