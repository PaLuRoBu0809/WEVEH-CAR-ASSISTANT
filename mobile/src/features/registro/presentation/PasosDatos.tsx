import { StyleSheet, View } from 'react-native';

import { Campo, Casilla, espacio, Texto } from '@/shared/design-system';

import { formatearMientrasEscribe } from '@/shared/fechas';
import type { Errores, Formulario } from '../domain/formulario';

type Props = {
  formulario: Formulario;
  errores: Errores;
  cambiar: (cambios: Partial<Formulario>) => void;
};

const soloDigitos = (texto: string) => texto.replace(/[^\d.]/g, '');

function CampoFecha(props: { etiqueta: string; valor: string; error?: string; ayuda?: string; onCambiar: (texto: string) => void }) {
  return (
    <Campo
      etiqueta={props.etiqueta}
      placeholder="DD/MM/AAAA"
      keyboardType="number-pad"
      maxLength={10}
      value={props.valor}
      onChangeText={(texto) => props.onCambiar(formatearMientrasEscribe(texto))}
      error={props.error}
      ayuda={props.ayuda}
    />
  );
}

/**
 * Paso 2: el kilometraje del tablero. El uso y los km al mes no se preguntan aquí (RF-GAR-02, RNF-11):
 * quedan "De todo un poco" y 1.000, y se cambian en el detalle del vehículo.
 */
export function PasoHoy({ formulario: f, errores, cambiar }: Props) {
  return (
    <View style={estilos.paso}>
      <Campo
        etiqueta="Kilometraje del tablero"
        placeholder="Ej. 190000"
        keyboardType="number-pad"
        value={f.km}
        onChangeText={(km) => cambiar({ km: soloDigitos(km) })}
        error={errores.km}
      />
    </View>
  );
}

/** Paso 3: último cambio de aceite o "No sé". */
export function PasoAceite({ formulario: f, errores, cambiar }: Props) {
  return (
    <View style={estilos.paso}>
      <Casilla
        texto="No sé cuándo fue el último cambio de aceite"
        marcada={f.aceiteNoSe}
        onCambiar={(aceiteNoSe) => cambiar({ aceiteNoSe })}
      />
      {f.aceiteNoSe ? (
        <Texto variante="nota" tono="texto2">
          Sin problema: lo marcamos como &quot;sin dato&quot; y te sugerimos revisarlo.
        </Texto>
      ) : (
        <>
          <Campo
            etiqueta="Kilometraje en el cambio"
            placeholder="Ej. 188000"
            keyboardType="number-pad"
            value={f.aceiteKm}
            onChangeText={(aceiteKm) => cambiar({ aceiteKm: soloDigitos(aceiteKm) })}
            error={errores.aceiteKm}
            ayuda="Suele estar en la calcomanía del parabrisas"
          />
          <CampoFecha etiqueta="Fecha del cambio" valor={f.aceiteFecha} error={errores.aceiteFecha} onCambiar={(aceiteFecha) => cambiar({ aceiteFecha })} />
        </>
      )}
    </View>
  );
}

/**
 * Paso 4: SOAT, revisión técnico-mecánica y seguro todo riesgo (opcional).
 *
 * @param conMatricula false al completar datos: la fecha de matrícula se edita en el detalle del vehículo
 */
export function PasoPapeles({ formulario: f, errores, cambiar, conMatricula = true }: Props & { conMatricula?: boolean }) {
  return (
    <View style={estilos.paso}>
      <CampoFecha
        etiqueta="¿Cuándo sacaste el SOAT?"
        valor={f.soatFecha}
        error={errores.soatFecha}
        ayuda="Fecha de expedición; vence al año"
        onCambiar={(soatFecha) => cambiar({ soatFecha })}
      />
      <Casilla
        texto="Mi vehículo es nuevo: la revisión técnico-mecánica aún no aplica"
        marcada={f.rtmAunNoAplica}
        onCambiar={(rtmAunNoAplica) => cambiar({ rtmAunNoAplica })}
      />
      {f.rtmAunNoAplica ? (
        conMatricula && <CampoFecha
          etiqueta="Fecha de matrícula (opcional)"
          valor={f.fechaMatricula}
          error={errores.fechaMatricula}
          ayuda={`Con ella calculamos la primera revisión: ${f.tipo === 'MOTO' ? '2' : '5'} años después`}
          onCambiar={(fechaMatricula) => cambiar({ fechaMatricula })}
        />
      ) : (
        <CampoFecha
          etiqueta="¿Cuándo fue la última revisión técnico-mecánica?"
          valor={f.rtmFecha}
          error={errores.rtmFecha}
          onCambiar={(rtmFecha) => cambiar({ rtmFecha })}
        />
      )}
      <Texto variante="seccion" tono="texto3" style={estilos.seccion}>
        Seguro todo riesgo (opcional)
      </Texto>
      <CampoFecha etiqueta="Inicio de la póliza" valor={f.seguroInicio} error={errores.seguroInicio} onCambiar={(seguroInicio) => cambiar({ seguroInicio })} />
      <Campo etiqueta="Aseguradora" placeholder="Ej. Sura" value={f.seguroEntidad} onChangeText={(seguroEntidad) => cambiar({ seguroEntidad })} />
    </View>
  );
}

/** Paso 5: alias y placa, opcionales. */
export function PasoNombre({ formulario: f, errores, cambiar }: Props) {
  return (
    <View style={estilos.paso}>
      <Campo etiqueta="¿Cómo lo llamas?" placeholder="Ej. La Prado" value={f.alias} onChangeText={(alias) => cambiar({ alias })} maxLength={40} />
      <Campo
        etiqueta="Placa"
        placeholder="Ej. ABC123"
        autoCapitalize="characters"
        value={f.placa}
        onChangeText={(placa) => cambiar({ placa })}
        error={errores.placa}
        ayuda="Solo la usamos para que reconozcas tu vehículo; no se comparte"
        maxLength={8}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { gap: espacio.m },
  seccion: { marginTop: espacio.s },
});
