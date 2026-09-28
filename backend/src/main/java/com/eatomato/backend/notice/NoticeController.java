package com.eatomato.backend.notice;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeController {

	/** 고정 공지가 항상 먼저, 그 안에서는 등록일 내림차순. 프론트 `listNotices` 와 같은 규칙. */
	private static final Sort LIST_SORT = Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("publishedAt"),
		Sort.Order.desc("id"));

	private final NoticeRepository noticeRepository;

	/** 공지 목록. query 가 있으면 제목 부분 일치로 거른다. */
	@GetMapping
	public List<NoticeResponse> list(@RequestParam(required = false) String query) {
		String keyword = query == null ? "" : query.trim();
		List<Notice> notices = keyword.isEmpty()
			? noticeRepository.findAll(LIST_SORT)
			: noticeRepository.findByTitleContainingIgnoreCase(keyword, LIST_SORT);
		return notices.stream().map(NoticeResponse::from).toList();
	}

	/** 정적 빌드(generateStaticParams)용 id 목록. */
	@GetMapping("/ids")
	public List<String> ids() {
		return noticeRepository.findAllIds().stream().map(String::valueOf).toList();
	}

	@GetMapping("/{id}")
	public NoticeResponse get(@PathVariable Long id) {
		return noticeRepository.findById(id)
			.map(NoticeResponse::from)
			.orElseThrow(() -> new ApiException(ErrorCode.NOTICE_NOT_FOUND));
	}
}
