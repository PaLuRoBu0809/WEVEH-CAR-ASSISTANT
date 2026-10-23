import { atributosDe, type LineaCatalogo, type TipoVehiculo } from '@/features/catalogo';

import { decidirAtributos as decidirConAtributos, textoOrigen, valorInicial } from './atributosLinea';

const decidirAtributos = (linea: LineaCatalogo | null, tipo: TipoVehiculo) =>
  decidirConAtributos(linea ? atributosDe(linea) : null, tipo);

const CUATRO_RUNNER: LineaCatalogo = {
  id: 1,
  marcaId: 145,
  nombre: '4RUNNER 4X4 4.0 V6 AT',
  clase: 'CAMIONETAS Y CAMPEROS',
  tipoVehiculo: 'CARRO',
  cilindradaCc: 4000,
  potenciaKw: null,
  combustible: null,
  transmision: 'AUTOMATICA',
  traccion: '4X4',
  puertas: 5,
  atributos: {
    combustible: { valores: ['GASOLINA'], origen: 'IA_WEB', fuente: 'https://www.toyota.com.co/4runner' },
    transmision: { valores: ['AUTOMATICA'], origen: 'CATALOGO', fuente: null },
    traccion: { valores: ['4X4'], origen: 'CATALOGO', fuente: null },
  },
};

const CORSA: LineaCatalogo = {
  ...CUATRO_RUNNER,
  nombre: 'CORSA GL 4P MT',
  clase: 'AUTOMOVIL',
  transmision: 'MECANICA',
  traccion: null,
  atributos: {
    combustible: null,
    transmision: { valores: ['MECANICA'], origen: 'CATALOGO', fuente: null },
    traccion: { valores: ['4X2', '4X4'], origen: 'IA_WEB', fuente: 'https://ejemplo.co/ficha' },
  },
};

describe('qué pregunta el registro de cada atributo (RF-CAT-04)', () => {
  test('con los tres atributos conocidos no pregunta nada', () => {
    const decisiones = decidirAtributos(CUATRO_RUNNER, 'CARRO');

    expect(decisiones.combustible).toMatchObject({ modo: 'DATO', valor: 'GASOLINA', origen: 'IA_WEB' });
    expect(decisiones.transmision).toMatchObject({ modo: 'DATO', valor: 'AUTOMATICA', origen: 'CATALOGO' });
    expect(decisiones.traccion).toMatchObject({ modo: 'DATO', valor: '4X4' });
  });

  test('sin combustible pregunta solo el combustible, con todas las opciones y nada marcado', () => {
    const decisiones = decidirAtributos(CORSA, 'CARRO');

    expect(decisiones.combustible.modo).toBe('PREGUNTAR');
    expect(decisiones.combustible.modo === 'PREGUNTAR' && decisiones.combustible.opciones).toHaveLength(6);
    expect(valorInicial(decisiones.combustible)).toBeNull();
    expect(decisiones.transmision.modo).toBe('DATO');
  });

  test('si el modelo se vende en 4x2 y 4x4, se elige solo entre esas', () => {
    expect(decidirAtributos(CORSA, 'CARRO').traccion).toEqual({ modo: 'ELEGIR_ENTRE', opciones: ['4X2', '4X4'] });
    expect(valorInicial(decidirAtributos(CORSA, 'CARRO').traccion)).toBeNull();
  });

  test('un dato investigado en la web muestra de dónde salió', () => {
    const combustible = decidirAtributos(CUATRO_RUNNER, 'CARRO').combustible;
    const transmision = decidirAtributos(CUATRO_RUNNER, 'CARRO').transmision;

    expect(combustible.modo === 'DATO' && textoOrigen(combustible)).toBe('Dato de WEVEH · según toyota.com.co');
    expect(transmision.modo === 'DATO' && textoOrigen(transmision)).toBe('Dato de WEVEH');
  });

  test('en moto no se pregunta la tracción', () => {
    expect(decidirAtributos({ ...CUATRO_RUNNER, tipoVehiculo: 'MOTO' }, 'MOTO').traccion).toBeNull();
    expect(decidirAtributos(null, 'MOTO').traccion).toBeNull();
  });

  test('escrito a mano pregunta todo', () => {
    const decisiones = decidirAtributos(null, 'CARRO');

    expect(decisiones.combustible.modo).toBe('PREGUNTAR');
    expect(decisiones.transmision.modo).toBe('PREGUNTAR');
    expect(decisiones.traccion?.modo).toBe('PREGUNTAR');
  });

  test('con un backend que aún no envía atributos usa los campos de la línea como dato del catálogo', () => {
    const decisiones = decidirAtributos({ ...CUATRO_RUNNER, atributos: undefined }, 'CARRO');

    expect(decisiones.combustible.modo).toBe('PREGUNTAR');
    expect(decisiones.transmision).toMatchObject({ modo: 'DATO', valor: 'AUTOMATICA', origen: 'CATALOGO' });
    expect(decisiones.traccion).toMatchObject({ modo: 'DATO', valor: '4X4', origen: 'CATALOGO' });
  });

  test('un valor que la app no conoce no se toma como dato', () => {
    const linea: LineaCatalogo = {
      ...CUATRO_RUNNER,
      atributos: { ...CUATRO_RUNNER.atributos!, combustible: { valores: ['HIDROGENO'], origen: 'IA_WEB', fuente: null } },
    };

    expect(decidirAtributos(linea, 'CARRO').combustible.modo).toBe('PREGUNTAR');
  });
});
