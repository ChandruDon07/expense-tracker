# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY backend/pom.xml backend/
RUN mvn -f backend/pom.xml dependency:go-offline -B

# Copy src and build the package
COPY backend/src backend/src
RUN mvn -f backend/pom.xml clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/backend/target/expense-tracker-backend-0.0.1-SNAPSHOT.jar app.jar

# Spring Boot application port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
