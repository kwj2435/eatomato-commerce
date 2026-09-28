package com.eatomato.backend.banner;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

	private final BannerRepository bannerRepository;

	@GetMapping
	@Transactional(readOnly = true)
	public List<BannerResponse> list() {
		return bannerRepository.findByActiveTrueOrderBySortOrderAsc().stream().map(BannerResponse::from).toList();
	}
}
