package com.eatomato.backend.content;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/site-contents")
@RequiredArgsConstructor
public class SiteContentController {

	private final SiteContentService siteContentService;

	/** 사이트 문구 전체. 예: {"HOME_WHATS_NEW_DESCRIPTION": "…", …} */
	@GetMapping
	public Map<String, String> all() {
		return siteContentService.all();
	}
}
