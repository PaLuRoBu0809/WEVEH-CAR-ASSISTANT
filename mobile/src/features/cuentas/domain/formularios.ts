/**
 * Reglas de los formularios de cuenta (RF-CTA-01, RF-CTA-02, RF-DAT-01). Los textos son los que ve la persona.
 */

/** Versión de la política que se acepta al crear la cuenta (docs/legal, borrador hasta después del MVP). */
export const VERSION_POLITICA = '0.1-borrador';

export const LARGO_MINIMO_CONTRASENA = 8;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DatosCrearCuenta = Readonly<{
  nombre: string;
  correo: string;
  contrasena: string;
  aceptaPolitica: boolean;
}>;

export const CREAR_CUENTA_INICIAL: DatosCrearCuenta = {
  nombre: '',
  correo: '',
  contrasena: '',
  aceptaPolitica: false,
};

export function esCorreoValido(correo: string): boolean {
  return CORREO.test(correo.trim());
}

/** Cada dato completo enciende una luz de la trama de W (mockup Portada → Crear cuenta). Son 4. */
export function datosQueFaltan(datos: DatosCrearCuenta): number {
  const completos = [
    datos.nombre.trim().length > 0,
    esCorreoValido(datos.correo),
    datos.contrasena.length >= LARGO_MINIMO_CONTRASENA,
    datos.aceptaPolitica,
  ];
  return completos.filter((completo) => !completo).length;
}

export function textoQueFalta(faltan: number): string {
  if (faltan === 0) {
    return 'Listo para crear tu cuenta';
  }
  return faltan === 1 ? 'Falta 1 dato' : `Faltan ${faltan} datos`;
}

/** Errores de los datos ya escritos; un campo vacío no muestra error mientras la persona no lo ha llenado. */
export function erroresCrearCuenta(datos: DatosCrearCuenta): Readonly<{ correo?: string; contrasena?: string }> {
  return {
    correo: datos.correo.trim() && !esCorreoValido(datos.correo) ? 'Revisa el correo: falta algo como @correo.com' : undefined,
    contrasena:
      datos.contrasena && datos.contrasena.length < LARGO_MINIMO_CONTRASENA
        ? `Usa ${LARGO_MINIMO_CONTRASENA} caracteres o más`
        : undefined,
  };
}

export function puedeIniciarSesion(correo: string, contrasena: string): boolean {
  return esCorreoValido(correo) && contrasena.length > 0;
}
