package com.eatomato.backend.member;

public enum Gender {
	MALE, FEMALE;

	public String value() {
		return name().toLowerCase();
	}

	public static Gender from(String value) {
		return Gender.valueOf(value.toUpperCase());
	}
}
