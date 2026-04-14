# ── Stage 1: Build ──────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom first (layer caching — only re-downloads
# dependencies when pom.xml changes, not on every source change)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q

# Copy source and build
COPY src ./src
RUN ./mvnw clean package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
# eclipse-temurin:17-jre-alpine is ~80MB — much smaller than JDK
FROM eclipse-temurin:17-jre-alpine

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy only the built JAR (not the entire build context)
COPY --from=builder /build/target/portfolio-service-*.jar app.jar

# JVM tuning for Render free tier (512 MB RAM):
# - UseSerialGC: lower overhead than G1 for single-CPU containers
# - Xms/Xmx: prevents OOM while leaving headroom for the OS
# - MaxMetaspaceSize: limits Spring Boot's class loading overhead
ENV JAVA_OPTS="-Xms96m -Xmx400m -XX:+UseSerialGC -XX:MaxMetaspaceSize=96m -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]