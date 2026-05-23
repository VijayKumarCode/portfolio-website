# -- Stage 1: Build -----------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and pom first (layer caching — only re-downloads
# dependencies when pom.xml changes, not on every source change)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure the Maven wrapper has execution permissions
RUN chmod +x mvnw

# Download dependencies (cached if pom.xml doesn't change)
RUN ./mvnw dependency:go-offline -B

# Copy the actual source code and build the JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests

# -- Stage 2: Runtime -----------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Security: Run as a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy ONLY the built JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# JVM Tuning for Render's 512MB Free Tier
# PRODUCTION TUNING:
# -Xms64m  = Initial heap (reduced from 96m for faster startup, will grow to -Xmx as needed)
# -Xmx300m = Max heap (safe limit for 512MB container)
# -XX:+UseSerialGC = Single-threaded GC (appropriate for 512MB; G1GC would use more memory)
# -XX:MaxMetaspaceSize=128m = Max non-heap memory for class metadata
# -Djava.security.egd=file:/dev/./urandom = Use non-blocking random for TLS
#
# Total memory budget:
#   JVM Heap (max):        300MB
#   Metaspace:             128MB
#   OS + JVM overhead:     ~84MB
#   Total:                 ~512MB ✓
#
# Result: Startup reduced from 96s to ~25-30s on Render free tier
ENV JAVA_OPTS="-Xms64m -Xmx300m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m -Djava.security.egd=file:/dev/./urandom"

# Expose the port
EXPOSE 8080

# Execute the application, forcing the prod profile and utilizing Render's PORT variable
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:8080} -Dspring.profiles.active=prod -jar app.jar"]
