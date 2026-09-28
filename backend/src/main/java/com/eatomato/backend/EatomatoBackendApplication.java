package com.eatomato.backend;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import com.eatomato.backend.global.time.Times;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EatomatoBackendApplication {

	public static void main(String[] args) {
		// DB 에는 한국 시간 기준 LocalDateTime 을 저장한다. 실행 환경의 타임존에 흔들리지 않도록 고정한다.
		TimeZone.setDefault(TimeZone.getTimeZone(Times.KST));
		SpringApplication.run(EatomatoBackendApplication.class, args);
	}

}
