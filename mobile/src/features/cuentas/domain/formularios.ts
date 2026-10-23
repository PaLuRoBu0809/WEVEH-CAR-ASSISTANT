/**
 * Reglas de los formularios de cuenta (RF-CTA-01, RF-CTA-02, RF-DAT-01). Los textos son los que ve la persona.
 */

/** Versión de la política que se acepta al crear la cuenta (docs/legal, borrador hasta después del MVP). */
export const VERSION_POLITICA = '0.1-borrador';

export const LARGO_MINIMO_CONTRASENA = 8;

/** Supabase no deja pedir otro correo antes de este tiempo (RF-CTA-03, RF-CTA-04). */
export const ESPERA_REENVIO_SEGUNDOS = 60;

/** Supabase tiene un solo vencimiento para todos los enlaces del correo (docs/adr/0022). */
export const VENCIMIENTO_ENLACE = '1 hora';

/** Por dónde aceptó la política al crear la cuenta (RF-DAT-02); igual que MedioConsentimiento del backend. */
export const MEDIO_CONSENTIMIENTO = { registro: 'APP_REGISTRO', google: 'APP_GOOGLE' } as const;

export type MedioConsentimiento = (typeof MEDIO_CONSENTIMIENTO)[keyof typeof MEDIO_CONSENTIMIENTO];

const NOMBRE_POR_DEFECTO = 'Sin nombre';

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

export type RevisionNuevaContrasena = Readonly<{
  ayudaNueva: string;
  ayudaConfirmacion?: string;
  errorConfirmacion?: string;
  lista: boolean;
}>;

/** Mockup 3 · Nueva contraseña: la misma regla del registro y las dos deben coincidir (RF-CTA-03). */
export function revisarNuevaContrasena(nueva: string, confirmacion: string): RevisionNuevaContrasena {
  const largoValido = nueva.length >= LARGO_MINIMO_CONTRASENA;
  const coinciden = largoValido && confirmacion === nueva;
  return {
    ayudaNueva: ayudaDelLargo(nueva),
    ayudaConfirmacion: coinciden ? 'Las contraseñas coinciden.' : undefined,
    errorConfirmacion: confirmacion && !coinciden ? 'Todavía no coinciden.' : undefined,
    lista: coinciden,
  };
}

function ayudaDelLargo(contrasena: string): string {
  if (contrasena.length === 0) {
    return `Usa ${LARGO_MINIMO_CONTRASENA} caracteres o más.`;
  }
  const faltan = LARGO_MINIMO_CONTRASENA - contrasena.length;
  if (faltan <= 0) {
    return 'Contraseña válida.';
  }
  return faltan === 1 ? 'Falta 1 carácter.' : `Faltan ${faltan} caracteres.`;
}

/**
 * El nombre para el perfil: el que escribió al crear la cuenta o, si entró con Google, el que Google comparte.
 */
export function nombreDesdeMetadatos(metadatos: Readonly<Record<string, unknown>> | undefined): string {
  for (const clave of ['nombre', 'full_name', 'name']) {
    const valor = metadatos?.[clave];
    if (typeof valor === 'string' && valor.trim()) {
      return valor.trim();
    }
  }
  return NOMBRE_POR_DEFECTO;
}
