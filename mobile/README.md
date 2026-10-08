# WEVEH — app móvil

Expo SDK 57 + React Native + TypeScript. Arquitectura y reglas: `CLAUDE.md`, `docs/arquitectura.md` y la skill `weveh-dev:feature-movil`.

## Correr en tu celular

1. Levanta el backend (`cd backend && ./mvnw spring-boot:run`).
2. Copia `.env.example` a `.env` y pon en `EXPO_PUBLIC_API_URL` la IP de tu computador en la red (no `localhost`).
3. `npm ci && npx expo start` y escanea el QR con Expo Go.

## Probar en el navegador del PC (solo desarrollo)

La versión web no es parte del MVP, pero sirve para probar sin celular.

1. En `backend/.env` pon `WEVEH_CORS_ORIGENES=http://localhost:8081` y levanta el backend.
2. `npx expo start` y abre http://localhost:8081 (o presiona `w`).

En web el `dispositivoId` se guarda en `localStorage` (`src/shared/dispositivo/almacen.web.ts`), no en SecureStore.

## Verificar

```bash
npm run lint        # ESLint + fronteras por feature (eslint-plugin-boundaries)
npm run typecheck   # tsc --noEmit
npm test            # Jest (jest-expo)
```

## Estructura

```
src/
├── app/                      # Expo Router: solo rutas
│   ├── (onboarding)/encendido.tsx
│   └── (tabs)/garaje.tsx
├── features/<feature>/{domain,infrastructure,application,presentation}
└── shared/{design-system,http,dispositivo}
```

Una feature solo importa de sí misma y de `src/shared`; `src/shared` no importa features. Las rutas componen features y no tienen lógica.
