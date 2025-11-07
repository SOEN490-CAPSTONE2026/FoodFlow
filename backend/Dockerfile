# Multi-stage build for Spring Boot
FROM mcr.microsoft.com/openjdk/jdk:17-ubuntu AS build
WORKDIR /app
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline

COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM mcr.microsoft.com/openjdk/jdk:17-ubuntu
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
