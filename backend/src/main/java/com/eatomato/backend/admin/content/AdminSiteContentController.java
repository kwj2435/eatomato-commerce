package com.eatomato.backend.admin.content;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.content.SiteContentService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

/** 사이트 문구 관리(메인 섹션 설명 등). */
@RestController
@RequestMapping("/api/admin/site-contents")
@RequiredArgsConstructor
public class AdminSiteContentController {

	private final SiteContentService siteContentService;

	@GetMapping
	public List<SiteContentService.Item> list() {
		return siteContentService.listForAdmin();
	}

	/** 문구 수정. 빈 문자열로 저장하면 화면에서 그 문구를 숨긴다. */
	@PutMapping("/{key}")
	public SiteContentService.Item update(@PathVariable String key, @Valid @RequestBody UpdateRequest request) {
		return siteContentService.update(key, request.value());
	}

	/** 기본값으로 되돌리기. */
	@DeleteMapping("/{key}")
	public SiteContentService.Item reset(@PathVariable String key) {
		return siteContentService.reset(key);
	}

	public record UpdateRequest(@NotNull @Size(max = 500) String value) {
	}
}
