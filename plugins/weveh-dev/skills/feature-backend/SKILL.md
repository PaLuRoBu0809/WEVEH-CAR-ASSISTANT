---
name: feature-backend
description: Receta paso a paso para agregar un caso de uso o endpoint al backend Spring Boot de WEVEH (dominio, puerto, servicio, adaptadores, migración Flyway, pruebas). Úsala al implementar cualquier funcionalidad nueva en backend/.
---

# Agregar una funcionalidad al backend

Ejemplo guía: "Registrar tanqueada" en el módulo `combustible`.

## Pasos

1. **Requisito**: escribe o ubica el ID (`RF-COM-01`) con criterios Gherkin. Si no existe, créalo en `docs/requisitos/`.
2. **Vectores**: si hay cálculo, agrega casos a `contracts/vectores-<tema>.json` antes del código.
3. **Dominio** (`combustible/domain`): entidad o value object con la regla. Sin anotaciones de Spring ni de persistencia.
   ```java
   public record Galones(BigDecimal valor) {
       public Galones {
           if (valor == null || valor.signum() <= 0 || valor.compareTo(LIMITE_GALONES) > 0)
               throw new GalonesInvalidosException(valor);
       }
   }
   ```
4. **Puerto de entrada** (`application/RegistrarTanqueada.java`): interfaz con un método y un `record` de comando que incluye el usuario (hoy `DispositivoId`; con ADR 0005, el `usuarioId` del token).
5. **Puertos de salida** (`application/puertos/`): `TanqueadaRepositorio`, y si necesita el vehículo, usa `GarajeApi`.
6. **Servicio** (`application/RegistrarTanqueadaServicio.java`): `@Service`, `@Transactional`, early returns, publica eventos de dominio si aplica.
7. **Persistencia** (`infrastructure/persistencia/`, ADR 0006): fila `record` con `@Table` y `@Version` si se edita, repositorio de **Spring Data JDBC** (`CrudRepository`, métodos derivados o `@Query`; `jsonb` con `cast(:valor as jsonb)`) y adaptador que implementa el puerto y traduce fila ↔ dominio. Nunca JPA.
8. **Migración**: `backend/src/main/resources/db/migration/V<n>__tanqueada.sql`. RLS activado en la tabla nueva.
9. **Web** (`infrastructure/web/`): controlador delgado, DTOs `record` con Bean Validation, respuesta 201 con `Location`. Errores con `ProblemDetail`.
10. **Pruebas**:
    - Unitarias de dominio (JUnit 5 + AssertJ) parametrizadas con los vectores.
    - Servicio con dobles de los puertos (Mockito).
    - Controlador con `@WebMvcTest` (validación, 404 para un recurso de otra persona, Problem Details).
11. `./mvnw -B verify` en verde (incluye `ModularidadTest`). Actualiza `contracts/openapi.yaml`.

## Endpoints del MVP (referencia)

| Método y ruta | Caso de uso |
|---|---|
| `POST /api/v1/vehiculos` | Registrar vehículo (registro básico) |
| `GET /api/v1/vehiculos` · `GET /api/v1/vehiculos/{id}` | Garaje y detalle con salud |
| `PUT /api/v1/vehiculos/{id}` · `DELETE /api/v1/vehiculos/{id}` | Editar y eliminar |
| `PUT /api/v1/vehiculos/{id}/kilometraje` | Actualizar km (`Idempotency-Key`) |
| `GET /api/v1/vehiculos/{id}/plan` | Plan por pieza con estado |
| `POST /api/v1/vehiculos/{id}/servicios` · `GET .../servicios` | Historial |
| `PUT /api/v1/vehiculos/{id}/documentos/{tipo}` | SOAT, RTM, seguro |
| `POST /api/v1/vehiculos/{id}/tanqueadas` · `GET .../consumo` | Combustible |
| `POST /api/v1/vehiculos/{id}/perfilamiento` y subrutas | Agente perfilador |
| `POST /api/v1/vehiculos/{id}/consultas` | Mecánico IA |
| `GET /api/v1/catalogo/...` | Catálogo (skill `catalogo-vehiculos`) |

Todas exigen la identidad de la persona (hoy `X-Weveh-Dispositivo`; con ADR 0005, `Authorization: Bearer`). Contrato completo: `docs/api.md`.

## Errores comunes a evitar

- Lógica en el controlador o en la fila de persistencia.
- Buscar por `id` sin filtrar por la persona dueña.
- Strings mágicos para estados o gravedades.
- Llamar al SDK de IA desde un servicio sin pasar por un puerto.
- Cambiar el esquema a mano en Supabase.
