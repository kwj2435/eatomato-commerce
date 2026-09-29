package com.eatomato.backend.content;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteContentService {

	private final SiteContentRepository repository;

	/** 스토어프론트용: 키 → 문구(수정 안 한 문구는 기본값). */
	public Map<String, String> all() {
		Map<String, SiteContent> saved = saved();
		Map<String, String> result = new LinkedHashMap<>();
		for (SiteContentKey key : SiteContentKey.values()) {
			SiteContent content = saved.get(key.name());
			result.put(key.name(), content == null ? key.getDefaultValue() : content.getContent());
		}
		return result;
	}

	/** 관리자 화면용 전체 목록. */
	public List<Item> listForAdmin() {
		Map<String, SiteContent> saved = saved();
		return Arrays.stream(SiteContentKey.values()).map(key -> Item.of(key, saved.get(key.name()))).toList();
	}

	@Transactional
	public Item update(String rawKey, String value) {
		SiteContentKey key = find(rawKey);
		String normalized = value.replace("\r\n", "\n").strip();
		SiteContent content = repository.findById(key.name())
			.map(existing -> {
				existing.change(normalized);
				return existing;
			})
			.orElseGet(() -> repository.save(new SiteContent(key.name(), normalized)));
		return Item.of(key, content);
	}

	/** 기본값으로 되돌린다(저장된 행을 지운다). */
	@Transactional
	public Item reset(String rawKey) {
		SiteContentKey key = find(rawKey);
		repository.deleteById(key.name());
		return Item.of(key, null);
	}

	private Map<String, SiteContent> saved() {
		return repository.findAll().stream().collect(Collectors.toMap(SiteContent::getKey, Function.identity()));
	}

	private static SiteContentKey find(String rawKey) {
		return SiteContentKey.from(rawKey).orElseThrow(() -> new ApiException(ErrorCode.SITE_CONTENT_NOT_FOUND));
	}

	/**
	 * @param customized 관리자가 수정했는지(false 면 기본값을 쓰는 중)
	 */
	public record Item(String key, String label, String value, String defaultValue, boolean customized,
		OffsetDateTime updatedAt) {

		static Item of(SiteContentKey key, SiteContent content) {
			return new Item(key.name(), key.getLabel(),
				content == null ? key.getDefaultValue() : content.getContent(),
				key.getDefaultValue(), content != null,
				content == null ? null : Times.toOffset(content.getUpdatedAt()));
		}
	}
}
