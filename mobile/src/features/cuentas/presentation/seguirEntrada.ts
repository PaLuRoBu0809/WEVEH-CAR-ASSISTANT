import type { ResultadoEntrada } from '../application/sesion';

export type DestinosEntrada = Readonly<{ onSesionIniciada: () => void; onFaltaPolitica: () => void }>;

/** A dónde sigue la persona después de entrar; si cerró la ventana de Google se queda donde estaba. */
export function seguirEntrada(resultado: ResultadoEntrada, destinos: DestinosEntrada) {
  if (resultado.tipo === 'lista') {
    destinos.onSesionIniciada();
  } else if (resultado.tipo === 'falta-politica') {
    destinos.onFaltaPolitica();
  }
}
