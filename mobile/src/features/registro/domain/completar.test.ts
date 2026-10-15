import type { VehiculoResumen } from '@/features/garaje';

import { aRegistroCompletado, erroresAlCompletar, formularioCompletarDesde } from './completar';
import { aSolicitud, erroresDelPaso, FORMULARIO_INICIAL, PASO_ACEITE, PASO_PAPELES } from './formulario';

const HOY = new Date(2026, 9, 15);

const SIN_DATOS = {
  tipo: 'CARRO',
  kilometraje: 190000,
  aceiteKm: null,
  aceiteFecha: null,
  soatFecha: null,
  rtmFecha: null,
  rtmAunNoAplica: false,
  seguroInicio: null,
  seguroEntidad: null,
} as unknown as VehiculoResumen;

describe('registro mínimo (RF-GAR-02)', () => {
  test('"Lo agrego después" deja pasar los pasos del aceite y los papeles sin datos', () => {
    const f = { ...FORMULARIO_INICIAL, aceiteDespues: true, papelesDespues: true };

    expect(erroresDelPaso(PASO_ACEITE, f, HOY)).toEqual({});
    expect(erroresDelPaso(PASO_PAPELES, f, HOY)).toEqual({});
  });

  test('lo dejado para después no se envía aunque algo se haya escrito', () => {
    const f = { ...FORMULARIO_INICIAL, km: '190000', aceiteKm: '188000', aceiteDespues: true, soatFecha: '30/06/2026', papelesDespues: true };

    const solicitud = aSolicitud(f);

    expect(solicitud.aceiteKm).toBeNull();
    expect(solicitud.soatFecha).toBeNull();
    expect(solicitud.rtmAunNoAplica).toBe(false);
  });
});

describe('completar lo que falta (RF-GAR-02b)', () => {
  test('arranca vacío para un vehículo sin datos y no exige nada', () => {
    const f = formularioCompletarDesde(SIN_DATOS);

    expect(f.soatFecha).toBe('');
    expect(erroresAlCompletar(f, HOY)).toEqual({});
  });

  test('se puede completar solo el SOAT', () => {
    const f = { ...formularioCompletarDesde(SIN_DATOS), soatFecha: '30/06/2026' };

    expect(erroresAlCompletar(f, HOY)).toEqual({});
    expect(aRegistroCompletado(f, 2)).toMatchObject({ soatFecha: '2026-06-30', rtmFecha: null, aceiteKm: null, versionFila: 2 });
  });

  test('el aceite necesita kilometraje y fecha, y no puede pasar el kilometraje actual', () => {
    const f = { ...formularioCompletarDesde(SIN_DATOS), aceiteKm: '200000' };

    const errores = erroresAlCompletar(f, HOY);

    expect(errores.aceiteKm).toBe('No puede tener más kilómetros que el vehículo hoy');
    expect(errores.aceiteFecha).toContain('DD/MM/AAAA');
  });

  test('una fecha futura se rechaza', () => {
    const f = { ...formularioCompletarDesde(SIN_DATOS), rtmFecha: '01/01/2030' };

    expect(erroresAlCompletar(f, HOY).rtmFecha).toBe('No puede ser una fecha futura');
  });
});
