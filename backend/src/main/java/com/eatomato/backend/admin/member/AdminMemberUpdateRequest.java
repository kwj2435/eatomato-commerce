package com.eatomato.backend.admin.member;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 등급·권한·이용 상태 변경. null 인 필드는 그대로 둔다. */
public record AdminMemberUpdateRequest(
	@Size(min = 1, max = 50) String grade,
	@Pattern(regexp = "USER|ADMIN") String role,
	Boolean enabled
) {
}
