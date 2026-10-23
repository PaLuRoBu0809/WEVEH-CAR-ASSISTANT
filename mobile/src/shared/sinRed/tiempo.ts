const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** "Sin conexión · actualizado hace X" (RNF-04). */
export function haceCuanto(desdeMs: number, ahoraMs: number): string {
  const pasado = Math.max(0, ahoraMs - desdeMs);
  if (pasado < MINUTO) {
    return 'hace un momento';
  }
  if (pasado < HORA) {
    return `hace ${Math.floor(pasado / MINUTO)} min`;
  }
  if (pasado < DIA) {
    return `hace ${Math.floor(pasado / HORA)} h`;
  }
  const dias = Math.floor(pasado / DIA);
  return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
}
