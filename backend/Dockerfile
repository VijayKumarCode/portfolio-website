# --- STAGE 1: Build Stage ---
# We use Maven to compile the code and package it into a .jar file.
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# 1. Copy only the pom.xml to cache dependencies. 
# This speeds up future builds if your dependencies haven't changed.
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 2. Copy the source code and build the application.
COPY src ./src
RUN mvn clean package -DskipTests

# --- STAGE 2: Runtime Stage ---
# We use an Ubuntu-based JRE image (Jammy Jellyfish) for the final container.
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# 3. Copy only the built .jar file from the build stage.
# This keeps the final image size very small.
COPY --from=build /app/target/*.jar app.jar

# 4. Expose the port (Render will use the PORT environment variable).
EXPOSE 8080

# 5. Run the application.
ENTRYPOINT ["java", "-Xmx512m", "-Dserver.port=${PORT:8080}", "-jar", "app.jar", "--spring.profiles.active=prod"]
