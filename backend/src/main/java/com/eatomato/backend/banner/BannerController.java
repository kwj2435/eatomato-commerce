package com.eatomato.backend.banner;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {

	private final BannerRepository bannerRepository;

	/** 위치별 노출 배너. placement 를 빼면 메인 상단(HERO) 배너다. */
	@GetMapping
	@Transactional(readOnly = true)
	public List<BannerResponse> list(@RequestParam(defaultValue = "HERO") BannerPlacement placement) {
		return bannerRepository.findByPlacementAndActiveTrueOrderBySortOrderAscIdAsc(placement).stream()
			.map(BannerResponse::from)
			.toList();
	}
}
