import { esUuidV4 } from './esUuidV4';

describe('esUuidV4', () => {
  test.each([
    '3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11',
    '3F1C9A2E-8B4D-4F6A-9C1E-2D7B5A0E4C11',
  ])('acepta %s', (texto) => {
    expect(esUuidV4(texto)).toBe(true);
  });

  test.each([
    null,
    undefined,
    '',
    'no-es-un-uuid',
    '3f1c9a2e-8b4d-1f6a-9c1e-2d7b5a0e4c11',
    '3f1c9a2e-8b4d-4f6a-7c1e-2d7b5a0e4c11',
    '1-1-1-1-1',
    '00000000-0000-0000-0000-000000000000',
  ])('rechaza %p', (texto) => {
    expect(esUuidV4(texto)).toBe(false);
  });
});
