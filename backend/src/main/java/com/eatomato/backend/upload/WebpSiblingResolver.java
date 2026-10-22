package com.eatomato.backend.upload;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.web.servlet.resource.AbstractResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

import jakarta.servlet.http.HttpServletRequest;

/**
 * /uploads 의 PNG·JPEG 를 요청하면 같은 이름의 .webp 가 있을 때 그것을 내려준다.
 *
 * 자동 압축 전에 올라간 원본(수 MB PNG)은 DB 에 주소가 박혀 있어, 주소는 그대로 두고 옆에 같은 이름의 WebP 를 만들어
 * 바꿔치기한다(2026-10-22 일괄 변환). 원본은 남겨 두므로 .webp 를 지우면 바로 원래대로 돌아간다.
 * WebP 를 받지 않는 클라이언트(Accept 에 image/webp 가 없음)에는 원본을 준다.
 */
public class WebpSiblingResolver extends AbstractResourceResolver {

	private static final Pattern RASTER = Pattern.compile("(?i)\\.(png|jpe?g)$");

	@Override
	protected Resource resolveResourceInternal(HttpServletRequest request, String requestPath,
		List<? extends Resource> locations, ResourceResolverChain chain) {
		if (request != null && RASTER.matcher(requestPath).find() && acceptsWebp(request)) {
			Resource webp = chain.resolveResource(request, RASTER.matcher(requestPath).replaceFirst(".webp"), locations);
			if (webp != null) {
				return webp;
			}
		}
		return chain.resolveResource(request, requestPath, locations);
	}

	@Override
	protected String resolveUrlPathInternal(String resourceUrlPath, List<? extends Resource> locations,
		ResourceResolverChain chain) {
		return chain.resolveUrlPath(resourceUrlPath, locations);
	}

	private static boolean acceptsWebp(HttpServletRequest request) {
		String accept = request.getHeader(HttpHeaders.ACCEPT);
		return accept != null && accept.contains("image/webp");
	}
}
