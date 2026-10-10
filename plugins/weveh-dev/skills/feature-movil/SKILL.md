---
name: feature-movil
description: Receta para crear o modificar pantallas y features de la app móvil Expo de WEVEH (estructura por features, TanStack Query, SQLite offline, formularios con Zod, sistema de diseño de los mockups). Úsala al trabajar en mobile/.
---

# Agregar una funcionalidad a la app móvil

## Crear el proyecto (solo la primera vez)

```bash
npx create-expo-app@latest mobile --template default
cd mobile
npx expo install expo-router expo-secure-store expo-sqlite expo-crypto @react-native-community/netinfo
npm i @tanstack/react-query zustand react-hook-form zod @hookform/resolvers
npm i -D jest jest-expo @testing-library/react-native eslint eslint-plugin-boundaries
```

Usa la versión de SDK que instale `create-expo-app` y no mezcles versiones a mano: `npx expo install` elige las compatibles.

## Pasos para una feature (ejemplo: tanqueadas)

1. **Dominio** `src/features/combustible/domain/consumo.ts`: funciones puras (`calcularKmPorGalon`, `clasificarConsumo`) probadas con `contracts/vectores-consumo.json`.
2. **Infraestructura** `infrastructure/`: `apiCombustible.ts` (llamadas con el cliente de `shared/http`, que agrega `X-Weveh-Dispositivo`), `repositorioLocal.ts` (SQLite) y mapeadores DTO → dominio.
3. **Aplicación** `application/`: hooks `useTanqueadas(vehiculoId)` y `useRegistrarTanqueada()` con TanStack Query; actualización optimista y cola offline.
4. **Presentación** `presentation/`: componentes puros (`TarjetaConsumo`, `FormularioTanqueada`). El formulario usa React Hook Form + Zod con mensajes en español claro.
5. **Ruta** `src/app/(tabs)/combustible.tsx`: solo compone la pantalla.
6. **Pruebas**: dominio con Jest; un componente clave con Testing Library.
7. `npm run lint`, `npx tsc --noEmit`, `npm test` en verde y prueba manual en Expo Go.

## Pantallas del MVP

Fuente visual: los mockups `WEVEH Portada.html` y `WEVEH Garaje.html` (raíz del repo). Decisiones del equipo (2026-10-08): sin login ni pestaña Servicios, tema claro por defecto.

| Ruta | Basada en |
|---|---|
| `src/app/(onboarding)/encendido` | Portada → Encendido: la W se dibuja, el punto ámbar se prende con resplandor, "weveh · Tu vehículo al día" (≈3 s). Si hay vehículos va a Inicio; si no, a la portada |
| `src/app/(onboarding)/portada` | Portada → carretera con el sol, **un solo botón** "Agregar mi vehículo" (sin "Crear cuenta" ni "Ya tengo cuenta") |
| `src/app/(onboarding)/registro-vehiculo` | Formulario por pasos; cada dato enciende una W de la trama (Portada → Crear cuenta) y la skill `dominio-vehiculo` §1 |
| `src/app/(onboarding)/completar-perfil` | Chat de preguntas con opciones rápidas (skill `agente-perfilador`) |
| `src/app/(tabs)/inicio` | Garaje → Inicio: "Lo más urgente", "Para hacer", "Lo último que hiciste", botón de luna |
| `src/app/(tabs)/garaje` y `garaje/[id]` | Tarjetas con salud; detalle con segmentos Piezas, Historial, Fallas y **Gasolina** (el combustible vive aquí, no en una pestaña) |
| `src/app/(tabs)/perfil` | Garaje → Perfil sin cuenta: aviso de identidad por dispositivo y Apariencia claro/oscuro |
| Botón flotante "Preguntar" | Mecánico IA por texto (sin cámara ni voz en el MVP) |

Pestañas: Inicio, Garaje y Perfil (barra propia en `src/shared/navegacion/BarraPestanas.tsx`). `Tabs` se importa de `expo-router/js-tabs` (el de `expo-router` está obsoleto en SDK 57).

## Sistema de diseño

- Tokens exactos de los mockups en `src/shared/design-system/tokens.ts` (`colores.claro`/`colores.oscuro`, `marca`, `fuentes`, `tipografia`). Primario `#005F54` en claro y `#3CCFB6` en oscuro; ámbar de marca `#FFB000`.
- Fuentes Manrope (500-800) y JetBrains Mono para cifras (kilómetros, valores), cargadas con `@expo-google-fonts/*` en `src/app/_layout.tsx`.
- Tema: siempre abre en claro; el usuario elige oscuro con la luna o en Perfil (`useEstadoTema`, se guarda en el almacén del dispositivo). Las escenas de marca (encendido, portada) son siempre oscuras.
- Componentes: `Texto`, `Boton` (primario, secundario, menta, fantasma), `Pildora` + `Barra` (Bien/Atención/Urgente, siempre con texto), `Tarjeta`, `LogoW`, íconos de trazo.
- Objetivos táctiles de 44 pt o más; etiquetas de accesibilidad en botones de ícono.
- Animaciones con Reanimated respetando `useReducedMotion`.
- Copy sin jerga, como en los mockups. Todo diagnóstico muestra "Orientación, no reemplaza al mecánico".

## Reglas

- Nada de lógica de negocio en componentes ni en rutas.
- Ninguna llave de API en la app: todo lo que se empaqueta es público. La IA se llama solo desde el backend.
- Una feature no importa internos de otra: solo su `index.ts` (`eslint-plugin-boundaries`, categoría `api-publica`).
