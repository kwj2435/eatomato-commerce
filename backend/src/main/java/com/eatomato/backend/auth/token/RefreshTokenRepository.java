package com.eatomato.backend.auth.token;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	@Modifying
	@Query("update RefreshToken t set t.revokedAt = :now where t.memberId = :memberId and t.revokedAt is null")
	int revokeAllByMemberId(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);

	@Modifying
	@Query("delete from RefreshToken t where t.expiresAt < :now or t.revokedAt < :revokedBefore")
	int deleteStale(@Param("now") LocalDateTime now, @Param("revokedBefore") LocalDateTime revokedBefore);
}
