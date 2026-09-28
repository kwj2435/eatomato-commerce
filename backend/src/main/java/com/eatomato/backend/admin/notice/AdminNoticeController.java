package com.eatomato.backend.admin.notice;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Sort;
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

import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;
import com.eatomato.backend.global.time.Times;
import com.eatomato.backend.notice.Notice;
import com.eatomato.backend.notice.NoticeRepository;
import com.eatomato.backend.notice.NoticeResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminNoticeController {

	private static final String DEFAULT_AUTHOR = "관리자";

	private final NoticeRepository noticeRepository;

	@GetMapping
	public List<NoticeResponse> list() {
		return noticeRepository.findAll(Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("publishedAt"),
			Sort.Order.desc("id"))).stream().map(NoticeResponse::from).toList();
	}

	@GetMapping("/{id}")
	public NoticeResponse get(@PathVariable Long id) {
		return NoticeResponse.from(find(id));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Transactional
	public NoticeResponse create(@Valid @RequestBody AdminNoticeRequest request) {
		Notice notice = new Notice(numberOf(request), request.title().trim(), authorOf(request),
			publishedAtOf(request), request.pinned(), paragraphsOf(request));
		return NoticeResponse.from(noticeRepository.save(notice));
	}

	@PutMapping("/{id}")
	@Transactional
	public NoticeResponse update(@PathVariable Long id, @Valid @RequestBody AdminNoticeRequest request) {
		Notice notice = find(id);
		notice.update(numberOf(request), request.title().trim(), authorOf(request), publishedAtOf(request),
			request.pinned(), paragraphsOf(request));
		return NoticeResponse.from(notice);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	public void delete(@PathVariable Long id) {
		noticeRepository.delete(find(id));
	}

	private Notice find(Long id) {
		return noticeRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOTICE_NOT_FOUND));
	}

	/** 고정 공지는 번호 대신 "공지" 라벨을 쓰므로 번호를 비운다. */
	private static Integer numberOf(AdminNoticeRequest request) {
		return request.pinned() ? null : request.number();
	}

	private static String authorOf(AdminNoticeRequest request) {
		return request.author() == null || request.author().isBlank() ? DEFAULT_AUTHOR : request.author().trim();
	}

	private static LocalDateTime publishedAtOf(AdminNoticeRequest request) {
		return request.publishedAt() == null ? Times.now()
			: request.publishedAt().atZoneSameInstant(Times.KST).toLocalDateTime();
	}

	private static List<String> paragraphsOf(AdminNoticeRequest request) {
		// 본문은 개행으로 이어 저장하므로 문단 안의 개행은 문단 구분으로 펼친다.
		return request.body().stream()
			.flatMap(paragraph -> paragraph.lines())
			.map(String::trim)
			.filter(line -> !line.isEmpty())
			.toList();
	}
}
