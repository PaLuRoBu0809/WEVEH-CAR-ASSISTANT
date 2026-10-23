import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Boton,
  Campo,
  espacio,
  fuentes,
  IconoAtras,
  Opciones,
  radio,
  TACTIL_MINIMO,
  Tarjeta,
  Texto,
  useTema,
} from '@/shared/design-system';
import { aFechaVisible, formatearMientrasEscribe, hoyIso } from '@/shared/fechas';
import { mensajeParaPersona } from '@/shared/http';
import { AvisoSinConexion, useConexion } from '@/shared/sinRed';

import {
  nuevoCambioKilometraje,
  pideConfirmacion,
  useActualizarKilometraje,
  useCancelarKilometrajeEsperandoRed,
  useCorregirKilometraje,
  useEditarVehiculo,
  useEliminarVehiculo,
  useKilometrajesEsperandoRed,
  useVehiculo,
} from '../application/useVehiculos';
import { aEdicion, aEntero, erroresEdicion, errorKilometraje, formularioDesde, type FormularioEdicion } from '../domain/edicion';
import {
  COMBUSTIBLES,
  listaFaltantes,
  nombreParaMostrar,
  puedeCorregirKilometraje,
  TRACCIONES,
  TRANSMISIONES,
  type VehiculoResumen,
} from '../domain/vehiculo';
import { EstadoError } from './EstadoError';

type Props = Readonly<{
  vehiculoId: string;
  onVolver: () => void;
  onCompletarDatos: (vehiculoId: string) => void;
  onEliminado: () => void;
}>;

const formatoKm = new Intl.NumberFormat('es-CO');

const USOS = [
  { valor: 'CIUDAD', texto: 'Ciudad' },
  { valor: 'CARRETERA', texto: 'Carretera' },
  { valor: 'MIXTO', texto: 'De todo un poco' },
] as const;

/** Detalle del vehículo (RF-GAR-02b, 03, 04 y 05). */
export function PantallaVehiculo({ vehiculoId, onVolver, onCompletarDatos, onEliminado }: Props) {
  const tema = useTema();
  const margenes = useSafeAreaInsets();
  const { data: vehiculo, error, isPending, refetch, dataUpdatedAt } = useVehiculo(vehiculoId);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tema.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.contenido, { paddingTop: margenes.top + espacio.s, paddingBottom: margenes.bottom + 96 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver al garaje" onPress={onVolver} style={estilos.atras}>
          <IconoAtras color={tema.texto} tamano={24} />
        </Pressable>
        <AvisoSinConexion actualizadoEn={dataUpdatedAt} />
        {isPending && <ActivityIndicator color={tema.primario} accessibilityLabel="Cargando el vehículo" />}
        {error && <EstadoError mensaje={mensajeParaPersona(error)} onReintentar={() => refetch()} />}
        {vehiculo && (
          <>
            <View>
              <Texto variante="nota" tono="texto3">
                {vehiculo.marca} {vehiculo.linea} · {vehiculo.anioModelo}
              </Texto>
              <Texto variante="titulo" accessibilityRole="header">
                {nombreParaMostrar(vehiculo)}
              </Texto>
            </View>
            <SeccionKilometraje vehiculo={vehiculo} />
            {vehiculo.datosFaltantes.length > 0 && (
              <Tarjeta>
                <Texto variante="fuerte">Te falta {listaFaltantes(vehiculo.datosFaltantes)}</Texto>
                <Texto variante="nota" tono="texto2">
                  Con esos datos te avisamos antes de que algo se venza.
                </Texto>
                <Boton pequeno texto="Completar datos" onPress={() => onCompletarDatos(vehiculo.id)} />
              </Tarjeta>
            )}
            <SeccionDatos key={vehiculo.versionFila} vehiculo={vehiculo} />
            <SeccionEliminar vehiculo={vehiculo} onEliminado={onEliminado} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * RF-GAR-05: nunca baja; un salto raro muestra la pregunta del backend y se confirma.
 * RF-GAR-06: sin red queda anotado en el celular y se envía solo cuando vuelve la conexión.
 */
function SeccionKilometraje({ vehiculo }: { vehiculo: VehiculoResumen }) {
  const tema = useTema();
  const [km, setKm] = useState('');
  const [mostrarError, setMostrarError] = useState(false);
  const actualizar = useActualizarKilometraje(vehiculo.id);
  const conectado = useConexion();
  const esperandoRed = useKilometrajesEsperandoRed(vehiculo.id) > 0;
  const cancelarEsperando = useCancelarKilometrajeEsperandoRed(vehiculo.id);
  const [corrigiendo, setCorrigiendo] = useState(false);
  const error = mostrarError ? errorKilometraje(km) : undefined;
  const pregunta = pideConfirmacion(actualizar.error) ? actualizar.error.problema.detail : null;
  const sePuedeCorregir = puedeCorregirKilometraje(vehiculo.kmActualizadoEn, hoyIso());

  // Confirma el número que se envió: si se anotó sin red, el campo ya está vacío
  const confirmarSalto = () => {
    const enviado = actualizar.variables?.kilometraje ?? aEntero(km) ?? 0;
    actualizar.mutate(nuevoCambioKilometraje(vehiculo.id, enviado, true), { onSuccess: () => setKm('') });
  };

  const guardar = (confirmado: boolean) => {
    if (errorKilometraje(km)) {
      setMostrarError(true);
      return;
    }
    actualizar.mutate(nuevoCambioKilometraje(vehiculo.id, aEntero(km) ?? 0, confirmado), {
      onSuccess: () => setKm(''),
    });
    if (!conectado) {
      setKm('');
    }
  };

  return (
    <Tarjeta>
      <Texto variante="seccion" tono="texto3">
        Kilometraje
      </Texto>
      <Texto style={{ fontFamily: fuentes.monoNegrita, fontSize: 24 }}>{formatoKm.format(vehiculo.kilometraje)} km</Texto>
      <Texto variante="nota" tono="texto2">
        Anotado el {aFechaVisible(vehiculo.kmActualizadoEn)}
      </Texto>
      <Campo
        etiqueta="¿Cuánto marca hoy el tablero?"
        placeholder={`Ej. ${formatoKm.format(vehiculo.kilometraje + 1200)}`}
        keyboardType="number-pad"
        value={km}
        error={error}
        onChangeText={(texto) => {
          actualizar.reset();
          setKm(texto.replace(/[^\d.]/g, ''));
        }}
      />
      {pregunta ? (
        <View style={[estilos.aviso, { backgroundColor: tema.primarioTinte }]} accessibilityRole="alert">
          <Texto variante="fuerte" tono="primarioTinta">
            {pregunta}
          </Texto>
          <View style={estilos.botones}>
            <Boton pequeno texto="Sí, es correcto" deshabilitado={actualizar.isPending} onPress={confirmarSalto} />
            <Boton pequeno variante="secundario" texto="Corregir" onPress={() => actualizar.reset()} />
          </View>
        </View>
      ) : (
        <>
          {actualizar.error && <AvisoError mensaje={mensajeParaPersona(actualizar.error)} />}
          {esperandoRed && (
            <View style={estilos.aviso}>
              <Texto variante="nota" tono="texto2" accessibilityLiveRegion="polite">
                Quedó anotado en tu celular. Lo enviamos solo cuando vuelva la señal.
              </Texto>
              <Boton
                pequeno
                variante="secundario"
                texto="Cancelar"
                ayuda="Quita el kilometraje que espera señal"
                onPress={() => {
                  cancelarEsperando();
                  actualizar.reset();
                }}
              />
            </View>
          )}
          {actualizar.isSuccess && (
            <Texto variante="nota" style={{ color: tema.okTinta }}>
              Listo, quedó anotado.
            </Texto>
          )}
          <Boton
            pequeno
            texto={actualizar.isPending && !esperandoRed ? 'Guardando…' : 'Actualizar kilometraje'}
            deshabilitado={!km || esperandoRed || (actualizar.isPending && conectado)}
            onPress={() => guardar(false)}
          />
          {sePuedeCorregir && !esperandoRed && !corrigiendo && (
            <Pressable accessibilityRole="button" onPress={() => setCorrigiendo(true)} style={estilos.enlace}>
              <Texto variante="fuerte" tono="primarioTinta">
                ¿Te equivocaste? Corregir esta lectura
              </Texto>
            </Pressable>
          )}
          {corrigiendo && <CorregirLectura vehiculo={vehiculo} onCerrar={() => setCorrigiendo(false)} />}
        </>
      )}
    </Tarjeta>
  );
}

/**
 * ADR 0023: la última lectura se corrige hacia abajo en sus primeros 7 días, sin quedar por debajo de la anterior
 * (eso lo valida el backend y lo explica en el error). Para subir se anota una lectura nueva.
 */
function CorregirLectura({ vehiculo, onCerrar }: { vehiculo: VehiculoResumen; onCerrar: () => void }) {
  const [km, setKm] = useState('');
  const corregir = useCorregirKilometraje(vehiculo.id);
  const valor = aEntero(km);
  const valido = valor !== null && valor < vehiculo.kilometraje;

  return (
    <View style={estilos.correccion}>
      <Campo
        etiqueta="¿Cuál era el número correcto?"
        placeholder={`Menor que ${formatoKm.format(vehiculo.kilometraje)}`}
        keyboardType="number-pad"
        value={km}
        ayuda="Solo puedes corregir la última lectura, en los 7 días siguientes a anotarla."
        onChangeText={(texto) => {
          corregir.reset();
          setKm(texto.replace(/[^\d.]/g, ''));
        }}
      />
      {corregir.error && <AvisoError mensaje={mensajeParaPersona(corregir.error)} />}
      <View style={estilos.botones}>
        <Boton
          pequeno
          texto={corregir.isPending ? 'Guardando…' : 'Guardar corrección'}
          deshabilitado={!valido || corregir.isPending}
          onPress={() => corregir.mutate(valor ?? 0, { onSuccess: onCerrar })}
        />
        <Boton pequeno variante="secundario" texto="Cancelar" onPress={onCerrar} />
      </View>
    </View>
  );
}

/** RF-GAR-03: alias, placa, uso, km al mes, fecha de matrícula, combustible, caja y tracción. */
function SeccionDatos({ vehiculo }: { vehiculo: VehiculoResumen }) {
  const tema = useTema();
  const [formulario, setFormulario] = useState<FormularioEdicion>(() => formularioDesde(vehiculo));
  const [mostrarErrores, setMostrarErrores] = useState(false);
  const editar = useEditarVehiculo(vehiculo.id);
  const errores = mostrarErrores ? erroresEdicion(formulario) : {};
  const cambiar = (cambio: Partial<FormularioEdicion>) => {
    editar.reset();
    setFormulario((actual) => ({ ...actual, ...cambio }));
  };

  const guardar = () => {
    if (Object.keys(erroresEdicion(formulario)).length > 0) {
      setMostrarErrores(true);
      return;
    }
    editar.mutate(aEdicion(formulario, vehiculo.versionFila, vehiculo.tipo));
  };

  return (
    <Tarjeta>
      <Texto variante="seccion" tono="texto3">
        Datos del vehículo
      </Texto>
      <Campo etiqueta="¿Cómo lo llamas?" placeholder="Ej. La Prado" maxLength={40} value={formulario.alias} onChangeText={(alias) => cambiar({ alias })} />
      <Campo
        etiqueta="Placa"
        placeholder="Ej. ABC123"
        autoCapitalize="characters"
        maxLength={8}
        value={formulario.placa}
        error={errores.placa}
        onChangeText={(placa) => cambiar({ placa })}
      />
      <Texto variante="fuerte">¿Por dónde lo usas más?</Texto>
      <Opciones etiqueta="Uso" opciones={USOS} valor={formulario.uso} onCambiar={(uso) => cambiar({ uso })} />
      <Campo
        etiqueta="Kilómetros al mes (más o menos)"
        keyboardType="number-pad"
        value={formulario.kmMes}
        error={errores.kmMes}
        onChangeText={(kmMes) => cambiar({ kmMes: kmMes.replace(/[^\d.]/g, '') })}
      />
      <Campo
        etiqueta="Fecha de matrícula (opcional)"
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
        value={formulario.fechaMatricula}
        error={errores.fechaMatricula}
        onChangeText={(texto) => cambiar({ fechaMatricula: formatearMientrasEscribe(texto) })}
      />
      <Texto variante="fuerte">Combustible</Texto>
      <Opciones etiqueta="Combustible" opciones={COMBUSTIBLES} valor={formulario.combustible} onCambiar={(combustible) => cambiar({ combustible })} />
      <Texto variante="fuerte">Caja</Texto>
      <Opciones etiqueta="Caja" opciones={TRANSMISIONES} valor={formulario.transmision} onCambiar={(transmision) => cambiar({ transmision })} />
      {vehiculo.tipo === 'CARRO' && (
        <>
          <Texto variante="fuerte">Tracción</Texto>
          <Opciones etiqueta="Tracción" opciones={TRACCIONES} valor={formulario.traccion} onCambiar={(traccion) => cambiar({ traccion })} />
        </>
      )}
      {editar.error && <AvisoError mensaje={mensajeParaPersona(editar.error)} />}
      {editar.isSuccess && (
        <Texto variante="nota" style={{ color: tema.okTinta }}>
          Cambios guardados.
        </Texto>
      )}
      <Boton texto={editar.isPending ? 'Guardando…' : 'Guardar cambios'} deshabilitado={editar.isPending} onPress={guardar} />
    </Tarjeta>
  );
}

/** RF-GAR-04: borra el vehículo con todo lo suyo, después de confirmar. */
function SeccionEliminar({ vehiculo, onEliminado }: { vehiculo: VehiculoResumen; onEliminado: () => void }) {
  const tema = useTema();
  const [confirmando, setConfirmando] = useState(false);
  const eliminar = useEliminarVehiculo();
  const nombre = nombreParaMostrar(vehiculo);

  if (!confirmando) {
    return <Boton variante="secundario" texto={`Eliminar ${nombre}`} onPress={() => setConfirmando(true)} />;
  }
  return (
    <View style={[estilos.aviso, { backgroundColor: tema.errorTinte }]}>
      <Texto variante="fuerte" style={{ color: tema.errorTinta }}>
        ¿Eliminar {nombre}? Se borra todo lo que guardaste de él.
      </Texto>
      {eliminar.error && <AvisoError mensaje={mensajeParaPersona(eliminar.error)} />}
      <View style={estilos.botones}>
        <Boton
          pequeno
          texto={eliminar.isPending ? 'Eliminando…' : 'Sí, eliminar'}
          deshabilitado={eliminar.isPending}
          onPress={() => eliminar.mutate(vehiculo.id, { onSuccess: onEliminado })}
        />
        <Boton pequeno variante="secundario" texto="Cancelar" onPress={() => setConfirmando(false)} />
      </View>
    </View>
  );
}

function AvisoError({ mensaje }: { mensaje: string }) {
  const tema = useTema();
  return (
    <Texto variante="nota" accessibilityRole="alert" style={{ color: tema.errorTinta }}>
      {mensaje}
    </Texto>
  );
}

const estilos = StyleSheet.create({
  contenido: { paddingHorizontal: espacio.l, gap: espacio.m },
  atras: { width: TACTIL_MINIMO, height: TACTIL_MINIMO, justifyContent: 'center', marginLeft: -8 },
  aviso: { borderRadius: radio.l, padding: 12, gap: 10 },
  botones: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  enlace: { minHeight: TACTIL_MINIMO, justifyContent: 'center' },
  correccion: { gap: 10 },
});
