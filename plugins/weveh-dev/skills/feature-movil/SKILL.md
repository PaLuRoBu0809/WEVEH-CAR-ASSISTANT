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

| Ruta | Basada en |
|---|---|
| `(onboarding)/encendido` | Mockup Portada: punto ámbar + W (≈3 s) |
| `(onboarding)/portada` | Mockup Portada, con un solo botón "Agregar mi vehículo" (sin login) |
| `(onboarding)/registro-vehiculo` | Formulario por pasos con luces (skill `dominio-vehiculo` §1) |
| `(onboarding)/completar-perfil` | Chat de preguntas con opciones rápidas (skill `agente-perfilador`) |
| `(tabs)/inicio` | Mockup Garaje → Inicio: "Lo más urgente", "Para hacer", "Lo último que hiciste" |
| `(tabs)/garaje` y `garaje/[id]` | Tarjetas con salud, piezas, papeles, historial, fallas |
| `(tabs)/preguntar` | Mecánico IA por texto (sin cámara ni voz en el MVP) |
| `(tabs)/combustible` | Tanqueadas y consumo |

## Sistema de diseño

- Tokens en `src/shared/design-system/tokens.ts`: teal claro `#3CCFB6` para acciones sobre fondo oscuro, ámbar para "por vencer", rojo para "vencido", y su versión para modo claro.
- Estados siempre con texto además de color ("Por vencer", no solo una barra ámbar).
- Objetivos táctiles de 44 pt o más; etiquetas de accesibilidad en botones de ícono.
- Animaciones con Reanimated y respetando "reducir movimiento".
- Copy sin jerga, como en los mockups. Todo diagnóstico muestra "Orientación, no reemplaza al mecánico".

## Reglas

- Nada de lógica de negocio en componentes ni en rutas.
- Ninguna llave de API en la app: todo lo que se empaqueta es público. La IA se llama solo desde el backend.
- Una feature no importa internos de otra (`eslint-plugin-boundaries`).
