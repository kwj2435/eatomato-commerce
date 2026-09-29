package com.eatomato.backend.auth.limit;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.eatomato.backend.global.config.AppProperties;
import com.eatomato.backend.global.error.ApiException;
import com.eatomato.backend.global.error.ErrorCode;

/**
 * 로그인 무차별 대입 방어.
 *
 * 최근 window(기본 15분) 안의 실패를 계정별·IP별로 센다. 계정은 maxPerAccount(5)번, IP 는 maxPerIp(20)번 넘게
 * 틀리면 가장 오래된 실패가 window 밖으로 나갈 때까지 로그인을 막는다(맞는 비밀번호여도).
 * 로그인에 성공하면 그 계정의 실패 기록은 지운다.
 *
 * 서버 한 대 기준이라 메모리에 둔다(재시작하면 초기화). 여러 대로 늘리면 Redis 등으로 옮긴다.
 * 바깥에서는 nginx limit_req 가 초당 요청 수를 한 번 더 제한한다.
 */
@Component
public class LoginAttemptLimiter {

	private final int maxPerAccount;
	private final int maxPerIp;
	private final Duration window;
	private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

	public LoginAttemptLimiter(AppProperties properties) {
		AppProperties.LoginLimit limit = properties.loginLimit();
		this.maxPerAccount = limit == null ? 5 : limit.maxPerAccount();
		this.maxPerIp = limit == null ? 20 : limit.maxPerIp();
		this.window = limit == null ? Duration.ofMinutes(15) : limit.window();
	}

	/** 잠겨 있으면 429 로 막는다. 로그인 처리 전에 부른다. */
	public void check(String account, String ip) {
		Instant now = Instant.now();
		Duration wait = max(retryAfter(accountKey(account), maxPerAccount, now), retryAfter(ipKey(ip), maxPerIp, now));
		if (!wait.isZero()) {
			long minutes = Math.max(1, (wait.getSeconds() + 59) / 60);
			throw new ApiException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
				"로그인 시도가 너무 많습니다. " + minutes + "분 후 다시 시도해 주세요.");
		}
	}

	public void recordFailure(String account, String ip) {
		Instant now = Instant.now();
		add(accountKey(account), now);
		add(ipKey(ip), now);
	}

	public void recordSuccess(String account) {
		failures.remove(accountKey(account));
	}

	/** 10분마다 오래된 기록을 치운다. */
	@Scheduled(fixedDelay = 10 * 60 * 1000)
	public void cleanUp() {
		Instant cutoff = Instant.now().minus(window);
		failures.entrySet().removeIf(entry -> {
			synchronized (entry.getValue()) {
				prune(entry.getValue(), cutoff);
				return entry.getValue().isEmpty();
			}
		});
	}

	private Duration retryAfter(String key, int max, Instant now) {
		Deque<Instant> times = failures.get(key);
		if (times == null) {
			return Duration.ZERO;
		}
		synchronized (times) {
			prune(times, now.minus(window));
			if (times.size() < max) {
				return Duration.ZERO;
			}
			// max 번째로 최근 실패가 window 밖으로 나가면 다시 시도할 수 있다.
			Instant unlockAt = times.stream().skip(times.size() - max).findFirst().orElse(now).plus(window);
			return Duration.between(now, unlockAt).isNegative() ? Duration.ZERO : Duration.between(now, unlockAt);
		}
	}

	private void add(String key, Instant now) {
		Deque<Instant> times = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
		synchronized (times) {
			times.addLast(now);
			// 기록이 한없이 쌓이지 않게 한다(가장 큰 기준만큼만 필요).
			while (times.size() > Math.max(maxPerAccount, maxPerIp)) {
				times.removeFirst();
			}
		}
	}

	private static void prune(Deque<Instant> times, Instant cutoff) {
		while (!times.isEmpty() && times.peekFirst().isBefore(cutoff)) {
			times.removeFirst();
		}
	}

	private static Duration max(Duration a, Duration b) {
		return a.compareTo(b) >= 0 ? a : b;
	}

	private static String accountKey(String account) {
		return "account:" + (account == null ? "" : account.trim().toLowerCase(Locale.ROOT));
	}

	private static String ipKey(String ip) {
		return "ip:" + (ip == null ? "unknown" : ip);
	}
}
