# Imagen del backend para Render (ADR 0008). La configuración llega por variables de entorno, nunca en la imagen.

# 1) Compilar con el JDK 25
FROM eclipse-temurin:25-jdk AS compilacion
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# En Windows la copia local puede traer CRLF: se limpia para que el wrapper corra en Linux
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src/ src/
RUN ./mvnw -B -q -DskipTests package && cp target/*-SNAPSHOT.jar app.jar

# 2) Ejecutar solo con el JRE 25
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --uid 1001 weveh
COPY --from=compilacion /app/app.jar app.jar
USER weveh
# El plan gratis de Render tiene 512 MB: la memoria de Java se ajusta al contenedor
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
