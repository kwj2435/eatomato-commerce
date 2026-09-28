package com.eatomato.backend;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.util.Locale;

import javax.sql.DataSource;

import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 테스트용 가드: 읽기 전용 트랜잭션에서 INSERT/UPDATE/DELETE 를 하면 실패시킨다.
 *
 * 운영 MySQL 은 readOnly 트랜잭션의 쓰기를 거절하지만 테스트용 H2 는 그냥 통과시킨다.
 * 그래서 쓰기 메서드에 @Transactional 을 빠뜨린 버그(로그인 시 리프레시 토큰 저장 500)가 테스트에서 안 보였다.
 */
@Configuration
class ReadOnlyWriteGuard {

	@Bean
	static BeanPostProcessor readOnlyWriteGuardPostProcessor() {
		return new BeanPostProcessor() {
			@Override
			public Object postProcessAfterInitialization(Object bean, String beanName) {
				if (bean instanceof DataSource dataSource && !(bean instanceof GuardedDataSource)) {
					return guard(dataSource);
				}
				return bean;
			}
		};
	}

	interface GuardedDataSource extends DataSource {
	}

	private static DataSource guard(DataSource target) {
		InvocationHandler handler = (proxy, method, args) -> {
			Object result = invoke(target, method, args);
			if (result instanceof Connection connection) {
				return guard(connection);
			}
			return result;
		};
		return (DataSource) Proxy.newProxyInstance(ReadOnlyWriteGuard.class.getClassLoader(),
			new Class<?>[] {GuardedDataSource.class}, handler);
	}

	private static Connection guard(Connection target) {
		InvocationHandler handler = (proxy, method, args) -> {
			String name = method.getName();
			if ((name.equals("prepareStatement") || name.equals("prepareCall"))
				&& args != null && args[0] instanceof String sql && target.isReadOnly() && isWrite(sql)) {
				throw new IllegalStateException("읽기 전용 트랜잭션에서 쓰기: " + sql);
			}
			return invoke(target, method, args);
		};
		return (Connection) Proxy.newProxyInstance(ReadOnlyWriteGuard.class.getClassLoader(),
			new Class<?>[] {Connection.class}, handler);
	}

	private static boolean isWrite(String sql) {
		String head = sql.stripLeading().toLowerCase(Locale.ROOT);
		return head.startsWith("insert") || head.startsWith("update") || head.startsWith("delete");
	}

	private static Object invoke(Object target, java.lang.reflect.Method method, Object[] args) throws Throwable {
		try {
			return method.invoke(target, args);
		} catch (InvocationTargetException e) {
			throw e.getCause();
		}
	}
}
