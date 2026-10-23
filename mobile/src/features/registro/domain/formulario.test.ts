import { aFechaIso, formatearMientrasEscribe } from '@/shared/fechas';
import { aEntero, aSolicitud, erroresDelPaso, FORMULARIO_INICIAL, pasoCompleto, type Formulario } from './formulario';

const AHORA = new Date(2026, 9, 8, 10, 0);

const PRADO: Formulario = {
  ...FORMULARIO_INICIAL,
  marcaId: 145,
  marca: 'TOYOTA',
  catalogoLineaId: 7811,
  linea: 'PRADO VX 5P AT',
  cilindradaCc: 3400,
  anio: '2008',
  transmision: 'AUTOMATICA',
  km: '190.000',
  aceiteKm: '188000',
  aceiteFecha: '05/06/2026',
  soatFecha: '30/06/2026',
  rtmFecha: '28/06/2026',
  alias: ' La Prado ',
  placa: 'abc 123',
};

describe('fechas', () => {
  test('pone las barras mientras se escribe', () => {
    expect(formatearMientrasEscribe('0506')).toBe('05/06');
    expect(formatearMientrasEscribe('05062026')).toBe('05/06/2026');
    expect(formatearMientrasEscribe('05/06/20261')).toBe('05/06/2026');
  });

  test('convierte a ISO solo fechas reales', () => {
    expect(aFechaIso('05/06/2026')).toBe('2026-06-05');
    expect(aFechaIso('31/02/2026')).toBeNull();
    expect(aFechaIso('2026-06-05')).toBeNull();
  });
});

describe('formulario de registro', () => {
  test('acepta kilómetros con puntos de miles', () => {
    expect(aEntero('190.000')).toBe(190000);
    expect(aEntero('-5')).toBeNull();
  });

  test('la Prado completa los cinco pasos', () => {
    [0, 1, 2, 3, 4].forEach((paso) => expect(pasoCompleto(paso, PRADO, AHORA)).toBe(true));
  });

  test('paso 1 exige marca, línea y un año válido', () => {
    const errores = erroresDelPaso(0, { ...FORMULARIO_INICIAL, anio: '2030' }, AHORA);
    expect(errores.marca).toBeDefined();
    expect(errores.linea).toBeDefined();
    expect(errores.anio).toBe('El año modelo va de 1950 a 2027');
  });

  test('el aceite no puede tener más kilómetros que el vehículo', () => {
    expect(erroresDelPaso(2, { ...PRADO, aceiteKm: '200000' }, AHORA).aceiteKm).toBe(
      'No puede tener más kilómetros que el vehículo hoy',
    );
  });

  test('"No sé" del aceite completa el paso', () => {
    expect(pasoCompleto(2, { ...PRADO, aceiteNoSe: true, aceiteKm: '', aceiteFecha: '' }, AHORA)).toBe(true);
  });

  test('las fechas futuras no se aceptan', () => {
    expect(erroresDelPaso(3, { ...PRADO, soatFecha: '09/10/2026' }, AHORA).soatFecha).toBe('No puede ser una fecha futura');
  });

  test('"Aún no aplica" reemplaza la fecha de la revisión', () => {
    expect(pasoCompleto(3, { ...PRADO, rtmAunNoAplica: true, rtmFecha: '' }, AHORA)).toBe(true);
  });

  test('arma la solicitud de la API en ISO', () => {
    const solicitud = aSolicitud(PRADO);
    expect(solicitud).toMatchObject({
      catalogoLineaId: 7811,
      anioModelo: 2008,
      kilometraje: 190000,
      aceiteKm: 188000,
      aceiteFecha: '2026-06-05',
      soatFecha: '2026-06-30',
      rtmFecha: '2026-06-28',
      rtmAunNoAplica: false,
      alias: 'La Prado',
      kmPromedioMes: 1000,
    });
  });

  test('con "No sé" y "Aún no aplica" no envía esas fechas', () => {
    const solicitud = aSolicitud({ ...PRADO, aceiteNoSe: true, rtmAunNoAplica: true });
    expect(solicitud.aceiteKm).toBeNull();
    expect(solicitud.aceiteFecha).toBeNull();
    expect(solicitud.rtmFecha).toBeNull();
  });

  test('un vehículo escrito a mano no lleva línea del catálogo', () => {
    expect(aSolicitud({ ...PRADO, manual: true }).catalogoLineaId).toBeNull();
  });

  test('el uso y los km al mes no se preguntan: van "Mixto" y 1.000 (RF-GAR-02)', () => {
    expect(pasoCompleto(1, { ...PRADO, kmMes: '' }, AHORA)).toBe(true);
    expect(aSolicitud(FORMULARIO_INICIAL)).toMatchObject({ uso: 'MIXTO', kmPromedioMes: 1000 });
  });

  test('"No sé" y sin responder se envían sin dato; nunca se rellena gasolina (RF-CAT-04)', () => {
    const solicitud = aSolicitud({ ...PRADO, combustible: 'NO_SE', transmision: null, traccion: '4X4' });
    expect(solicitud).toMatchObject({ combustible: null, transmision: null, traccion: '4X4' });
    expect(aSolicitud(FORMULARIO_INICIAL).combustible).toBeNull();
  });

  test('una moto no envía tracción', () => {
    expect(aSolicitud({ ...PRADO, tipo: 'MOTO', traccion: '4X4' }).traccion).toBeNull();
  });
});
