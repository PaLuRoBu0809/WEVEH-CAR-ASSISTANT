# WEVEH — app móvil

Expo SDK 57 + React Native + TypeScript. Arquitectura y reglas: `CLAUDE.md`, `docs/arquitectura.md` y la skill `weveh-dev:feature-movil`.

## Correr en tu celular

1. Levanta el backend (`cd backend && ./mvnw spring-boot:run`).
2. Copia `.env.example` a `.env` y pon en `EXPO_PUBLIC_API_URL` la IP de tu computador en la red (no `localhost`).
3. `npm ci && npx expo start` y escanea el QR con Expo Go.

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
