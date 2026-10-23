/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

import { VERSION_POLITICA } from './formularios';
import { POLITICA } from './politica';

const DOCUMENTO = readFileSync(
  join(__dirname, '../../../../../docs/legal/politica-tratamiento-datos-BORRADOR.md'),
  'utf8',
);

describe('política en la app (RF-DAT-01)', () => {
  test('tiene las mismas secciones, en el mismo orden, que el documento de docs/legal', () => {
    const titulos = DOCUMENTO.split('\n')
      .filter((linea) => linea.startsWith('## '))
      .map((linea) => linea.slice(3).trim());

    expect(POLITICA.secciones.map((seccion) => seccion.titulo)).toEqual(titulos);
  });

  test('es la versión que se acepta al crear la cuenta', () => {
    expect(DOCUMENTO).toContain(`**Versión:** ${VERSION_POLITICA}`);
    expect(POLITICA.version).toBe(VERSION_POLITICA);
  });

  test('cada pendiente del documento sigue marcado en la app', () => {
    const pendientes = (texto: string) => texto.match(/\[POR DEFINIR/g)?.length ?? 0;
    const textoApp = JSON.stringify(POLITICA);

    expect(pendientes(textoApp)).toBe(pendientes(DOCUMENTO));
  });
});
