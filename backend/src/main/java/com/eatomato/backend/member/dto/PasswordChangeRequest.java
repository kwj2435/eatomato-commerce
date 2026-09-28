package com.eatomato.backend.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PasswordChangeRequest(
	@NotBlank String currentPassword,
	@NotBlank @Size(min = 8, max = 64) String newPassword
) {
}
