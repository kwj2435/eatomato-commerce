package com.eatomato.backend.global.config;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import com.eatomato.backend.admin.AdminAccessInterceptor;
import com.eatomato.backend.global.security.CurrentMemberIdArgumentResolver;
import com.eatomato.backend.member.MemberRepository;
import com.eatomato.backend.upload.WebpSiblingResolver;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

/** Page 응답은 {content, page:{size, number, totalElements, totalPages}} 형태로 고정한다. */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final AppProperties properties;
	private final AdminAccessInterceptor adminAccessInterceptor;
	private final MemberRepository memberRepository;

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(new CurrentMemberIdArgumentResolver(memberRepository));
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(adminAccessInterceptor).addPathPatterns("/api/admin/**");
		// 같은 주소라도 Accept 에 따라 WebP/원본이 달라지므로 캐시가 구분하게 한다(WebpSiblingResolver).
		registry.addInterceptor(new HandlerInterceptor() {
			@Override
			public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
				response.setHeader(HttpHeaders.VARY, HttpHeaders.ACCEPT);
				return true;
			}
		}).addPathPatterns("/uploads/**");
	}

	/**
	 * 후기 사진 등 업로드 파일을 /uploads/** 로 서빙한다.
	 * 파일명이 UUID 라 내용이 바뀌지 않으므로 브라우저가 오래 캐시하게 한다. PNG·JPEG 는 .webp 사본이 있으면 그것을 준다.
	 */
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		String location = Path.of(properties.upload().dir()).toAbsolutePath().normalize().toUri().toString();
		if (!location.endsWith("/")) {
			location += "/";
		}
		registry.addResourceHandler("/uploads/**")
			.addResourceLocations(location)
			.setCacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
			// 변환 스크립트가 나중에 .webp 를 만들어도 바로 보이도록 경로 결과를 캐시하지 않는다.
			.resourceChain(false)
			.addResolver(new WebpSiblingResolver())
			.addResolver(new PathResourceResolver());
	}
}
