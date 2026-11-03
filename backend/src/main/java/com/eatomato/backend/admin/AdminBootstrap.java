package com.eatomato.backend.admin;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.member.Member;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.member.MemberRole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 첫 관리자 계정을 만든다.
 *
 * 관리자 권한은 관리자 화면에서만 줄 수 있어, 맨 처음 한 명은 환경 변수(ADMIN_LOGIN_ID / ADMIN_PASSWORD)로 만든다.
 * 계정이 이미 있으면 권한만 ADMIN 으로 올리고 비밀번호는 건드리지 않는다(관리자가 바꾼 비밀번호를 덮어쓰지 않도록).
 *
 * 비밀번호 로그인이 꺼져 있으면(운영) 이 계정으로 들어올 수 없으므로 만들지도, 다시 켜지도 않는다.
 * 그래야 운영에서 정리(비활성화)한 예전 관리자 계정이 재기동 때 되살아나지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

	private final AppProperties properties;
	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		AppProperties.Admin admin = properties.admin();
		if (!properties.passwordAuthEnabled()
			|| admin == null || !StringUtils.hasText(admin.loginId()) || !StringUtils.hasText(admin.password())) {
			return;
		}
		Member member = memberRepository.findByLoginId(admin.loginId()).orElseGet(() -> {
			String email = StringUtils.hasText(admin.email()) ? admin.email() : admin.loginId() + "@admin.eatomato.kr";
			log.info("관리자 계정을 만듭니다: {}", admin.loginId());
			return memberRepository.save(
				new Member(admin.loginId(), passwordEncoder.encode(admin.password()), email, "관리자"));
		});
		if (!member.isAdmin()) {
			member.changeRole(MemberRole.ADMIN);
			log.info("{} 계정에 관리자 권한을 부여했습니다.", admin.loginId());
		}
		member.changeEnabled(true);
	}
}
