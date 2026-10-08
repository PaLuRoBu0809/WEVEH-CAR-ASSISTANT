// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const boundaries = require('eslint-plugin-boundaries');

const API_PUBLICA = { categories: 'api-publica' };

module.exports = defineConfig([
  expoConfig,
  globalIgnores(['dist/*', '.expo/*']),
  {
    // Fronteras por feature (docs/adr/0003-monolito-modular.md)
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'shared', pattern: 'src/shared/*', capture: ['modulo'] },
      ],
      // El index.ts de cada feature es su API pública
      'boundaries/files': [{ category: 'api-publica', pattern: 'src/features/*/index.ts' }],
    },
    rules: {
      'boundaries/dependencies': [
        2,
        {
          default: 'disallow',
          policies: [
            // Las rutas solo componen: usan la API pública de las features y shared
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { type: 'feature' }, file: API_PUBLICA } },
            },
            // Una feature usa sus propios archivos y la API pública de otras features
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: {
                  element: {
                    type: 'feature',
                    captured: { feature: '{{from.element.captured.feature}}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'feature' } },
              allow: { to: { element: { type: 'feature' }, file: API_PUBLICA } },
            },
            {
              from: { element: { types: { anyOf: ['app', 'feature', 'shared'] } } },
              allow: { to: { element: { type: 'shared' } } },
            },
          ],
        },
      ],
    },
  },
]);
