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
RUN useradd --system --uid 1001 app && mkdir -p /app/uploads && chown app /app/uploads
COPY --from=build /app/build/libs/app.jar app.jar
USER app

EXPOSE 8080
# VM 메모리가 1GB 미만이라 힙을 작게 잡는다.
ENV JAVA_OPTS="-Xms128m -Xmx256m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
