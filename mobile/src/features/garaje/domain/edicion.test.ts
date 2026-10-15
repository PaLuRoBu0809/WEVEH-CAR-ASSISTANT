import { aEdicion, erroresEdicion, errorKilometraje, formularioDesde } from './edicion';
import { listaFaltantes, tituloFaltantes, type VehiculoResumen } from './vehiculo';

const HOY = new Date(2026, 9, 15);

const PRADO: VehiculoResumen = {
  id: '7a1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c22',
  tipo: 'CARRO',
  catalogoLineaId: 7811,
  alias: 'La Prado',
  marca: 'TOYOTA',
  linea: 'PRADO VX 5P AT',
  cilindradaCc: 3400,
  anioModelo: 2008,
  combustible: null,
  transmision: 'AUTOMATICA',
  traccion: '4X4',
  placa: 'ABC123',
  fechaMatricula: '2008-03-15',
  kilometraje: 190000,
  kmActualizadoEn: '2026-10-01',
  uso: 'MIXTO',
  kmPromedioMes: 1000,
  aceiteKm: null,
  aceiteFecha: null,
  soatFecha: null,
  rtmFecha: null,
  rtmAunNoAplica: false,
  seguroInicio: null,
  seguroEntidad: null,
  datosFaltantes: ['SOAT', 'RTM', 'ACEITE'],
  versionFila: 3,
};

describe('editar el vehículo', () => {
  test('el formulario arranca con los datos actuales y las fechas en DD/MM/AAAA', () => {
    expect(formularioDesde(PRADO)).toEqual({
      alias: 'La Prado',
      placa: 'ABC123',
      uso: 'MIXTO',
      kmMes: '1000',
      fechaMatricula: '15/03/2008',
    });
  });

  test('sin cambios no hay errores', () => {
    expect(erroresEdicion(formularioDesde(PRADO), HOY)).toEqual({});
  });

  test('placa, km al mes y fecha de matrícula se validan con textos claros', () => {
    const errores = erroresEdicion(
      { alias: '', placa: 'AB', uso: 'CIUDAD', kmMes: '25000', fechaMatricula: '01/01/2030' },
      HOY,
    );

    expect(errores.placa).toContain('ABC123');
    expect(errores.kmMes).toBe('Escribe un número entre 0 y 20.000');
    expect(errores.fechaMatricula).toBe('No puede ser una fecha futura');
  });

  test('arma la solicitud con la versión que tenía la app', () => {
    const edicion = aEdicion({ alias: '  ', placa: 'xyz-987', uso: 'CARRETERA', kmMes: '2.500', fechaMatricula: '' }, 3);

    expect(edicion).toEqual({
      alias: null,
      placa: 'XYZ987',
      uso: 'CARRETERA',
      kmPromedioMes: 2500,
      fechaMatricula: null,
      versionFila: 3,
    });
  });
});

describe('kilometraje y datos que faltan', () => {
  test('el kilometraje acepta puntos de miles y rechaza lo que no es número', () => {
    expect(errorKilometraje('191.200')).toBeUndefined();
    expect(errorKilometraje('mucho')).toBe('Escribe los kilómetros del tablero');
    expect(errorKilometraje('3000000')).toContain('2.000.000');
  });

  test('la lista de lo que falta se lee como una frase', () => {
    expect(listaFaltantes(['SOAT'])).toBe('el SOAT');
    expect(listaFaltantes(['SOAT', 'RTM', 'ACEITE'])).toBe(
      'el SOAT, la revisión técnico-mecánica y el último cambio de aceite',
    );
  });

  test('si faltan papeles el aviso lo dice así; si solo falta el aceite, es un dato', () => {
    expect(tituloFaltantes('La Prado', ['SOAT', 'ACEITE'])).toBe('Te faltan los papeles de La Prado');
    expect(tituloFaltantes('La Prado', ['ACEITE'])).toBe('Te falta un dato de La Prado');
  });
});
