package com.eatomato.backend.admin.banner;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.banner.Banner;
import com.eatomato.backend.banner.BannerRepository;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** 메인 히어로 배너 관리. 노출 순서는 sortOrder 오름차순, active=false 는 메인에서 빠진다. */
@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBannerController {

	private final BannerRepository bannerRepository;

	@GetMapping
	public List<AdminBannerResponse> list() {
		return bannerRepository.findAllByOrderBySortOrderAscIdAsc().stream().map(AdminBannerResponse::from).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public AdminBannerResponse create(@Valid @RequestBody AdminBannerRequest request) {
		Banner banner = new Banner(request.href().trim(), request.imageUrl().trim(), request.alt().trim(),
			request.sortOrder(), request.active());
		return AdminBannerResponse.from(bannerRepository.save(banner));
	}

	@PutMapping("/{id}")
	@Transactional
	public AdminBannerResponse update(@PathVariable Long id, @Valid @RequestBody AdminBannerRequest request) {
		Banner banner = find(id);
		banner.update(request.href().trim(), request.imageUrl().trim(), request.alt().trim(), request.sortOrder(),
			request.active());
		return AdminBannerResponse.from(banner);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	public void delete(@PathVariable Long id) {
		bannerRepository.delete(find(id));
	}

	private Banner find(Long id) {
		return bannerRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.BANNER_NOT_FOUND));
	}
}
