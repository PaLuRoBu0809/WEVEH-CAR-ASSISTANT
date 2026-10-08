# Modelo de dominio del MVP

Versión revisada tras la decisión de quitar el login y enriquecer el perfil del vehículo. Los módulos se relacionan por id (`vehiculoId`), no por referencia de objeto; el diagrama los junta para leerlo completo.

## Diagrama de clases

```mermaid
classDiagram
  direction LR
  class Vehiculo {
    +VehiculoId id
    +DispositivoId dispositivo
    +TipoVehiculo tipo
    +Long catalogoVersionId
    +String marca
    +String linea
    +String version
    +int anioModelo
    +MotorInfo motor
    +String alias
    +String placa
    +LocalDate fechaMatricula
    +Kilometraje km
    +UsoVehiculo uso
    +int kmPromedioMes
    +EstadoPerfil estadoPerfil
    +actualizarKilometraje(Kilometraje) KilometrajeActualizado
  }
  class MotorInfo {
    <<value object>>
    +String codigo
    +int cilindradaCc
    +int cilindros
    +TipoCombustible combustible
    +Transmision transmision
    +Traccion traccion
    +SistemaDistribucion distribucion
  }
  class RegistroKilometraje {
    +LocalDate fecha
    +Kilometraje km
    +OrigenKm origen
  }
  class PiezaPlan {
    +String nombre
    +String explicacion
    +Integer intervaloKm
    +Integer intervaloMeses
    +boolean esSeguridad
    +Integer ultimoServicioKm
    +LocalDate ultimoServicioFecha
    +OrigenDato origen
    +String fuenteUrl
    +consumo(Kilometraje, LocalDate) Double
    +estado(Kilometraje, LocalDate) EstadoPieza
  }
  class RegistroServicio {
    +LocalDate fecha
    +Kilometraje km
    +String descripcion
    +String taller
    +Long valorCop
    +List~String~ piezasCambiadas
  }
  class Falla {
    +LocalDate fecha
    +Kilometraje km
    +String sintoma
    +String causa
    +String resolucion
    +boolean resuelta
  }
  class DocumentoLegal {
    +TipoDocumento tipo
    +LocalDate fechaRealizacion
    +LocalDate vence
    +String entidad
    +estado(LocalDate) EstadoDocumento
  }
  class Tanqueada {
    +LocalDate fecha
    +Kilometraje km
    +BigDecimal galones
    +Long valorCop
    +boolean tanqueLleno
  }
  class FichaTecnica {
    +String claveModelo
    +List~IntervaloRecomendado~ intervalos
    +ConsumoReferencia consumo
    +List~String~ fallasConocidas
    +List~Fuente~ fuentes
    +boolean verificada
  }
  class SesionPerfilamiento {
    +EstadoSesion estado
    +List~TurnoEntrevista~ turnos
    +List~DatoPropuesto~ propuestos
    +confirmar()
  }
  class ConsultaMecanico {
    +String sintoma
    +Diagnostico resultado
    +String versionPrompt
    +String modelo
  }
  class EstadoPieza {
    <<enumeration>>
    AL_DIA
    POR_VENCER
    VENCIDO
    SIN_DATO
  }
  class OrigenDato {
    <<enumeration>>
    FABRICANTE_VERIFICADO
    IA_WEB
    USUARIO
    GENERICO
  }
  class TipoDocumento {
    <<enumeration>>
    SOAT
    RTM
    SEGURO_TODO_RIESGO
  }
  Vehiculo *-- MotorInfo
  Vehiculo "1" *-- "0..*" RegistroKilometraje
  Vehiculo "1" --> "0..*" PiezaPlan : vehiculoId
  Vehiculo "1" --> "0..*" RegistroServicio : vehiculoId
  Vehiculo "1" --> "0..*" Falla : vehiculoId
  Vehiculo "1" --> "0..3" DocumentoLegal : vehiculoId
  Vehiculo "1" --> "0..*" Tanqueada : vehiculoId
  Vehiculo "1" --> "0..*" SesionPerfilamiento : vehiculoId
  Vehiculo "1" --> "0..*" ConsultaMecanico : vehiculoId
  Vehiculo ..> FichaTecnica : claveModelo
  PiezaPlan ..> EstadoPieza
  PiezaPlan ..> OrigenDato
  DocumentoLegal ..> TipoDocumento
```

`claveModelo` = `marca|linea|anioModelo|codigoMotor` normalizado (minúsculas, sin tildes). Varias personas con el mismo modelo comparten la ficha investigada, lo que abarata la IA y es la base de los datos agregados.

## Tablas (PostgreSQL)

```mermaid
erDiagram
  VEHICULO ||--o{ REGISTRO_KILOMETRAJE : registra
  VEHICULO ||--o{ PIEZA_PLAN : tiene
  VEHICULO ||--o{ REGISTRO_SERVICIO : acumula
  VEHICULO ||--o{ FALLA : registra
  VEHICULO ||--o{ DOCUMENTO_LEGAL : tiene
  VEHICULO ||--o{ TANQUEADA : registra
  VEHICULO ||--o{ SESION_PERFILAMIENTO : origina
  VEHICULO ||--o{ CONSULTA_MECANICO : origina
  FICHA_TECNICA ||--o{ VEHICULO : describe
  VEHICULO {
    uuid id PK
    uuid dispositivo_id
    text tipo
    bigint catalogo_version_id
    text marca
    text linea
    text version
    int anio_modelo
    jsonb motor
    text alias
    text placa
    date fecha_matricula
    int km
    text uso
    int km_promedio_mes
    text estado_perfil
    int version_fila
    timestamptz creado_en
  }
  PIEZA_PLAN {
    uuid id PK
    uuid vehiculo_id FK
    text nombre
    int intervalo_km
    int intervalo_meses
    bool es_seguridad
    int ultimo_servicio_km
    date ultimo_servicio_fecha
    text origen
    text fuente_url
  }
  DOCUMENTO_LEGAL {
    uuid id PK
    uuid vehiculo_id FK
    text tipo
    date fecha_realizacion
    date vence
    text entidad
  }
  TANQUEADA {
    uuid id PK
    uuid vehiculo_id FK
    date fecha
    int km
    numeric galones
    bigint valor_cop
    bool tanque_lleno
  }
  FICHA_TECNICA {
    text clave_modelo PK
    jsonb intervalos
    jsonb consumo_referencia
    jsonb fallas_conocidas
    jsonb fuentes
    bool verificada
    text modelo_ia
    timestamptz investigada_en
  }
  SESION_PERFILAMIENTO {
    uuid id PK
    uuid vehiculo_id FK
    text estado
    jsonb turnos
    jsonb propuestos
    timestamptz actualizada_en
  }
  CONSULTA_MECANICO {
    uuid id PK
    uuid vehiculo_id FK
    text sintoma
    jsonb diagnostico
    text version_prompt
    text modelo
    timestamptz creado_en
  }
```

Índices mínimos: `vehiculo(dispositivo_id)`, `pieza_plan(vehiculo_id)`, `documento_legal(vence)`, `tanqueada(vehiculo_id, km)`. Todas las tablas hijas con `ON DELETE CASCADE` para que eliminar un vehículo borre todo lo suyo.
