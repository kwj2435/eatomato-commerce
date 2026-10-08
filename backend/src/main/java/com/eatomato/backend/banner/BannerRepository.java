package com.eatomato.backend.banner;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BannerRepository extends JpaRepository<Banner, Long> {

	List<Banner> findByPlacementAndActiveTrueOrderBySortOrderAscIdAsc(BannerPlacement placement);

	List<Banner> findAllByOrderBySortOrderAscIdAsc();
}
