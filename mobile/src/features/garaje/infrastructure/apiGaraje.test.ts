import { pedir } from '@/shared/http';

import type { EdicionVehiculo, RegistroCompletado, SolicitudRegistro } from '../domain/vehiculo';
import {
  actualizarKilometraje,
  completarRegistro,
  corregirKilometraje,
  editarVehiculo,
  eliminarVehiculo,
  listarVehiculos,
  obtenerVehiculo,
  registrarVehiculo,
} from './apiGaraje';

jest.mock('@/shared/http', () => ({ pedir: jest.fn().mockResolvedValue('respuesta') }));

const mockPedir = pedir as jest.Mock;

describe('apiGaraje', () => {
  beforeEach(() => mockPedir.mockClear());

  test('lista y obtiene vehículos con GET', async () => {
    await expect(listarVehiculos()).resolves.toBe('respuesta');
    await obtenerVehiculo('v1');

    expect(mockPedir).toHaveBeenNthCalledWith(1, '/api/v1/vehiculos');
    expect(mockPedir).toHaveBeenNthCalledWith(2, '/api/v1/vehiculos/v1');
  });

  test('registra con POST y el cuerpo en JSON', async () => {
    const solicitud = { marca: 'TOYOTA' } as unknown as SolicitudRegistro;

    await registrarVehiculo(solicitud);

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos', { method: 'POST', body: JSON.stringify(solicitud) });
  });

  test('corregir la última lectura va a su propia ruta (ADR 0023)', async () => {
    await corregirKilometraje('v1', 134000);

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1/kilometraje/correccion', {
      method: 'PUT',
      body: JSON.stringify({ kilometraje: 134000 }),
    });
  });

  test('el kilometraje anotado sin red va con su clave y el día (RF-GAR-06)', async () => {
    await actualizarKilometraje('v1', 191000, false, { clave: 'clave-1', leidoEn: '2026-10-22' });

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1/kilometraje', {
      method: 'PUT',
      headers: { 'Idempotency-Key': 'clave-1' },
      body: JSON.stringify({ kilometraje: 191000, confirmado: false, leidoEn: '2026-10-22' }),
    });
  });

  test('edita, completa el registro y actualiza el kilometraje con PUT', async () => {
    const edicion = { alias: 'La Prado' } as unknown as EdicionVehiculo;
    const registro = { soatFecha: '2026-06-30' } as unknown as RegistroCompletado;

    await editarVehiculo('v1', edicion);
    await completarRegistro('v1', registro);
    await actualizarKilometraje('v1', 190500, true);

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1', { method: 'PUT', body: JSON.stringify(edicion) });
    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1/registro', {
      method: 'PUT',
      body: JSON.stringify(registro),
    });
    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1/kilometraje', {
      method: 'PUT',
      body: JSON.stringify({ kilometraje: 190500, confirmado: true }),
    });
  });

  test('elimina con DELETE', async () => {
    await eliminarVehiculo('v1');

    expect(mockPedir).toHaveBeenCalledWith('/api/v1/vehiculos/v1', { method: 'DELETE' });
  });
});
