package com.eatomato.backend.member;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {

	Optional<Member> findByLoginId(String loginId);

	Optional<Member> findByEmail(String email);

	boolean existsByLoginId(String loginId);

	Optional<Member> findByKakaoId(Long kakaoId);

	boolean existsByEmail(String email);

	boolean existsByEmailAndIdNot(String email, Long id);

	// ── 관리자 ──────────────────────────────────────────────

	@Query("""
		select m from Member m
		where (:keyword is null
		       or lower(m.loginId) like lower(concat('%', :keyword, '%'))
		       or lower(m.name) like lower(concat('%', :keyword, '%'))
		       or lower(m.email) like lower(concat('%', :keyword, '%')))
		  and (:role is null or m.role = :role)
		""")
	Page<Member> searchForAdmin(@Param("keyword") String keyword, @Param("role") MemberRole role, Pageable pageable);

	List<Member> findByIdIn(Collection<Long> ids);

	List<Member> findByLoginIdContainingIgnoreCase(String keyword);

	long countByCreatedAtGreaterThanEqual(LocalDateTime from);
}
