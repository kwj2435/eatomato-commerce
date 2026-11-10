# 백엔드 이미지: Gradle 로 bootJar 를 만든 뒤 JRE 이미지에 jar 만 담는다.

# ── build ─────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# 의존성 레이어를 소스와 분리해 소스만 바뀌면 캐시를 재사용한다.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN ./gradlew dependencies --no-daemon -q > /dev/null

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# ── runtime ───────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
ENV TZ=Asia/Seoul
# 업로드 이미지를 WebP 로 압축하는 cwebp(ImageOptimizer). 없으면 JPEG/PNG 로 저장한다.
RUN apt-get update && apt-get install -y --no-install-recommends webp && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 1001 app && mkdir -p /app/uploads && chown app /app/uploads
COPY --from=build /app/build/libs/app.jar app.jar
USER app

EXPOSE 8080
# VM 메모리가 작아 힙을 작게 잡는다.
# Metaspace 는 Spring Boot(JPA·Security·OAuth2) 기동만으로 120MB 안팎이라 128m 이면 몇십 시간 뒤 OOM 으로
# GC 가 멈추지 않고 돌며 API 가 10초 넘게 걸렸다(2026-11-10). 192m 로 올리고,
# OOM 이 나면 버티지 말고 종료해 restart: unless-stopped 로 다시 뜨게 한다.
ENV JAVA_OPTS="-Xms128m -Xmx224m -XX:+UseSerialGC -XX:MaxMetaspaceSize=192m -XX:ReservedCodeCacheSize=64m -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
