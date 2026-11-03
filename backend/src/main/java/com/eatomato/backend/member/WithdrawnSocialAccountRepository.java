package com.eatomato.backend.member;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WithdrawnSocialAccountRepository extends JpaRepository<WithdrawnSocialAccount, Long> {

	boolean existsByProviderAndIdHash(String provider, String idHash);

	@Modifying
	@Query("delete from WithdrawnSocialAccount w where w.withdrawnAt < :before")
	int deleteWithdrawnBefore(@Param("before") LocalDateTime before);
}
