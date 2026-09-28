package com.eatomato.backend.member;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

	Optional<Member> findByLoginId(String loginId);

	Optional<Member> findByEmail(String email);

	boolean existsByLoginId(String loginId);

	boolean existsByEmail(String email);

	boolean existsByEmailAndIdNot(String email, Long id);
}
