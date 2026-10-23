# Modelo de dominio del MVP

Diseño original, actualizado el 2026-10-21 con la ampliación aprobada (ADR 0005, 0016, 0017, 0018 y 0020): identidad por cuenta (`usuarioId`), servicio como factura con trabajos, concepto del mecánico, estado `SIN_DATO_REVISAR_YA`, documentos ampliados y licencia por cuenta. Las tablas vigentes están en `docs/datos.md`; las de abajo son guía. Los módulos se relacionan por id (`vehiculoId`, `usuarioId`), no por referencia de objeto; el diagrama los junta para leerlo completo.

## Diagrama de clases

```mermaid
classDiagram
  direction LR
  class Vehiculo {
    +VehiculoId id
    +UsuarioId usuario
    +TipoVehiculo tipo
    +Long catalogoLineaId
    +String marca
    +String linea
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
    +Integer margenFabricanteKm
    +Integer ultimoServicioKm
    +LocalDate ultimoServicioFecha
    +OrigenDato origen
    +String fuenteUrl
    +consumo(Kilometraje, LocalDate) Double
    +estado(Kilometraje, LocalDate) EstadoPieza
  }
  class Servicio {
    +LocalDate fecha
    +Kilometraje km
    +String taller
    +Long totalCop
    +String notas
    +List~String~ recomendaciones
    +String fotoFacturaId
  }
  class ServicioItem {
    +String pieza
    +AccionServicio accion
    +String especificacion
  }
  class ConceptoMecanico {
    +String pieza
    +String veredicto
    +LocalDate fecha
    +LocalDate vigenteHasta
    +Integer vigenteHastaKm
    +EstadoConcepto estado
  }
  class Licencia {
    +UsuarioId usuario
    +LocalDate vence
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
    SIN_DATO_REVISAR_YA
  }
  class AccionServicio {
    <<enumeration>>
    CAMBIO
    REVISION
    AJUSTE
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
    EXTINTOR
    IMPUESTO_VEHICULAR
    MULTA
  }
  class TipoCombustible {
    <<enumeration>>
    GASOLINA
    DIESEL
    GAS
    HIBRIDO
    HIBRIDO_ENCHUFABLE
    ELECTRICO
  }
  Vehiculo *-- MotorInfo
  Vehiculo "1" *-- "0..*" RegistroKilometraje
  Vehiculo "1" --> "0..*" PiezaPlan : vehiculoId
  Vehiculo "1" --> "0..*" Servicio : vehiculoId
  Servicio "1" *-- "1..*" ServicioItem
  ServicioItem ..> AccionServicio
  Vehiculo "1" --> "0..*" ConceptoMecanico : vehiculoId
  Vehiculo "1" --> "0..*" Falla : vehiculoId
  Vehiculo "1" --> "0..*" DocumentoLegal : vehiculoId
  MotorInfo ..> TipoCombustible
  Vehiculo "1" --> "0..*" Tanqueada : vehiculoId
  Vehiculo "1" --> "0..*" SesionPerfilamiento : vehiculoId
  Vehiculo "1" --> "0..*" ConsultaMecanico : vehiculoId
  Vehiculo ..> FichaTecnica : claveModelo
  PiezaPlan ..> EstadoPieza
  PiezaPlan ..> OrigenDato
  DocumentoLegal ..> TipoDocumento
```

La `Licencia` es de la cuenta (`usuarioId`), no de un vehículo, y solo guarda la fecha de vencimiento (RF-DOC-07). El kit de carretera es una lista sin fecha ligada al vehículo (RF-DOC-05). Solo un `ServicioItem` con `accion = CAMBIO` reinicia el intervalo de su pieza (ADR 0017).

`claveModelo` = `marca|linea|anioModelo|cilindradaCc` normalizado (minúsculas, sin tildes). Varias personas con el mismo modelo comparten la ficha investigada, lo que abarata la IA y es la base de los datos agregados.

## Tablas (PostgreSQL)

```mermaid
erDiagram
  VEHICULO ||--o{ REGISTRO_KILOMETRAJE : registra
  VEHICULO ||--o{ PIEZA_PLAN : tiene
  VEHICULO ||--o{ SERVICIO : acumula
  SERVICIO ||--|{ SERVICIO_ITEM : incluye
  VEHICULO ||--o{ CONCEPTO_MECANICO : tiene
  VEHICULO ||--o{ FALLA : registra
  VEHICULO ||--o{ DOCUMENTO_LEGAL : tiene
  VEHICULO ||--o{ TANQUEADA : registra
  VEHICULO ||--o{ SESION_PERFILAMIENTO : origina
  VEHICULO ||--o{ CONSULTA_MECANICO : origina
  FICHA_TECNICA ||--o{ VEHICULO : describe
  VEHICULO {
    uuid id PK
    uuid usuario_id FK
    text tipo
    bigint catalogo_linea_id
    text marca
    text linea
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

Índices mínimos: `vehiculo(usuario_id)`, `pieza_plan(vehiculo_id)`, `documento_legal(vence)`, `tanqueada(vehiculo_id, km)`. Todas las tablas hijas con `ON DELETE CASCADE` para que eliminar un vehículo borre todo lo suyo.
