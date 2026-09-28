package com.eatomato.backend.global.config;

import java.nio.file.Path;
import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.eatomato.backend.admin.AdminAccessInterceptor;
import com.eatomato.backend.global.security.CurrentMemberIdArgumentResolver;

import lombok.RequiredArgsConstructor;

/** Page 응답은 {content, page:{size, number, totalElements, totalPages}} 형태로 고정한다. */
@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

	private final AppProperties properties;
	private final AdminAccessInterceptor adminAccessInterceptor;

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(new CurrentMemberIdArgumentResolver());
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(adminAccessInterceptor).addPathPatterns("/api/admin/**");
	}

	/** 후기 사진 등 업로드 파일을 /uploads/** 로 서빙한다. */
	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		String location = Path.of(properties.upload().dir()).toAbsolutePath().normalize().toUri().toString();
		if (!location.endsWith("/")) {
			location += "/";
		}
		registry.addResourceHandler("/uploads/**").addResourceLocations(location);
	}
}
