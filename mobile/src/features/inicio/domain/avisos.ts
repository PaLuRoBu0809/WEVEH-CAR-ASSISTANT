import { listaFaltantes, nombreParaMostrar, tituloFaltantes, type VehiculoResumen } from '@/features/garaje';

/**
 * RF-GAR-02b: avisos de Inicio sobre lo que la persona dejó para después. Los papeles van primero porque vencen y
 * tienen multa; el aceite trae una guía para revisarlo.
 */
export type AvisoFaltante = Readonly<{
  vehiculoId: string;
  titulo: string;
  detalle: string;
  /** No sabemos cuándo fue el último cambio de aceite: se muestra la guía para revisarlo. */
  guiaAceite: boolean;
}>;

export function avisosDeInicio(vehiculos: readonly VehiculoResumen[]): AvisoFaltante[] {
  return vehiculos
    .filter((vehiculo) => vehiculo.datosFaltantes.length > 0)
    .map((vehiculo) => ({
      vehiculoId: vehiculo.id,
      titulo: tituloFaltantes(nombreParaMostrar(vehiculo), vehiculo.datosFaltantes),
      detalle: `Falta ${listaFaltantes(vehiculo.datosFaltantes)}. Con eso te avisamos antes de que algo se venza.`,
      guiaAceite: vehiculo.datosFaltantes.includes('ACEITE'),
    }));
}

/** Cómo revisar el aceite sin saber de mecánica (RF-GAR-02b). */
export const PASOS_REVISAR_ACEITE = [
  'Parquea en plano, apaga el motor y espera 5 minutos para que el aceite baje.',
  'Abre el capó y busca la varilla con la manija amarilla o naranja. En muchas motos es una ventanita al lado del motor.',
  'Saca la varilla, límpiala con un trapo, métela hasta el fondo y vuelve a sacarla.',
  'El aceite debe quedar entre las dos marcas. Si está por debajo de la mínima, agrega del tipo que diga el manual o ve al taller.',
  'Mira el color: miel o ámbar está bien; negro y espeso indica que toca cambiarlo; lechoso o con espuma es una alerta: llévalo al mecánico.',
] as const;
