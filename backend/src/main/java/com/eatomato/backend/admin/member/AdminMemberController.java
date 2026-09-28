package com.eatomato.backend.admin.member;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.admin.common.PageResponse;
import com.eatomato.backend.global.security.CurrentMemberId;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

	private final AdminMemberService adminMemberService;

	@GetMapping
	public PageResponse<AdminMemberSummary> list(
		@RequestParam(required = false) String q,
		@RequestParam(required = false) @Pattern(regexp = "USER|ADMIN") String role,
		@RequestParam(defaultValue = "0") @Min(0) int page,
		@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return adminMemberService.list(q, role,
			PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));
	}

	@GetMapping("/{id}")
	public AdminMemberDetail get(@PathVariable Long id) {
		return adminMemberService.get(id);
	}

	@PatchMapping("/{id}")
	public AdminMemberDetail update(@CurrentMemberId Long adminId, @PathVariable Long id,
		@Valid @RequestBody AdminMemberUpdateRequest request) {
		return adminMemberService.update(adminId, id, request);
	}
}
