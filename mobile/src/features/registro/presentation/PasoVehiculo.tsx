import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { nombreLinea, useLineas, useMarcas, type LineaCatalogo } from '@/features/catalogo';
import { Campo, espacio, fuentes, Opciones, radio, TACTIL_MINIMO, Texto, useTema } from '@/shared/design-system';

import type { Errores, Formulario } from '../domain/formulario';

type Props = {
  formulario: Formulario;
  errores: Errores;
  cambiar: (cambios: Partial<Formulario>) => void;
};

const MOSTRAR = 8;

function Resultado({ texto, onPress }: { texto: string; onPress: () => void }) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [estilos.resultado, { borderBottomColor: tema.linea }, pressed && { backgroundColor: tema.superficie }]}>
      <Texto>{texto}</Texto>
    </Pressable>
  );
}

function Elegido({ etiqueta, texto, onCambiar }: { etiqueta: string; texto: string; onCambiar: () => void }) {
  const tema = useTema();
  return (
    <View style={[estilos.elegido, { backgroundColor: tema.primarioTinte }]}>
      <View style={estilos.crece}>
        <Texto variante="nota" tono="texto2">
          {etiqueta}
        </Texto>
        <Texto variante="fuerte" tono="primarioTinta">
          {texto}
        </Texto>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar ${etiqueta.toLowerCase()}`} onPress={onCambiar} style={estilos.cambiar}>
        <Texto variante="fuerte" tono="primarioTinta" style={{ textDecorationLine: 'underline' }}>
          Cambiar
        </Texto>
      </Pressable>
    </View>
  );
}

/** Paso 1: tipo → marca → línea del catálogo del Ministerio → año; o texto libre si no aparece. */
export function PasoVehiculo({ formulario: f, errores, cambiar }: Props) {
  const tema = useTema();
  const [textoMarca, setTextoMarca] = useState('');
  const [textoLinea, setTextoLinea] = useState('');
  const marcas = useMarcas(f.tipo, textoMarca, !f.manual && f.marcaId === null);
  const lineas = useLineas(f.manual || f.catalogoLineaId !== null ? null : f.marcaId, f.tipo, textoLinea);

  const elegirLinea = (linea: LineaCatalogo) =>
    cambiar({
      catalogoLineaId: linea.id,
      linea: linea.nombre,
      cilindradaCc: linea.cilindradaCc,
      transmision: linea.transmision,
      traccion: linea.traccion,
      // El catálogo solo marca diésel, híbrido o eléctrico; sin pista se sugiere gasolina
      combustible: linea.combustible ?? 'GASOLINA',
    });

  return (
    <View style={estilos.paso}>
      <Opciones
        etiqueta="Tipo de vehículo"
        opciones={[
          { valor: 'CARRO', texto: 'Carro' },
          { valor: 'MOTO', texto: 'Moto' },
        ]}
        valor={f.tipo}
        onCambiar={(tipo) => {
          setTextoMarca('');
          setTextoLinea('');
          cambiar({ tipo, marcaId: null, marca: '', catalogoLineaId: null, linea: '', cilindradaCc: null });
        }}
      />

      {f.manual ? (
        <>
          <Campo etiqueta="Marca" value={f.marca} onChangeText={(marca) => cambiar({ marca })} error={errores.marca} autoCapitalize="characters" />
          <Campo etiqueta="Línea o modelo" value={f.linea} onChangeText={(linea) => cambiar({ linea })} error={errores.linea} autoCapitalize="characters" />
          <View style={[estilos.aviso, { backgroundColor: tema.primarioTinte }]}>
            <Texto variante="nota" tono="primarioTinta">
              Lo revisaremos para agregarlo al catálogo.
            </Texto>
          </View>
        </>
      ) : (
        <>
          {f.marcaId === null ? (
            <View>
              <Campo
                etiqueta="Marca"
                placeholder="Ej. Toyota"
                value={textoMarca}
                onChangeText={setTextoMarca}
                error={errores.marca}
                autoCorrect={false}
              />
              {marcas.isFetching && <ActivityIndicator color={tema.primario} style={estilos.cargando} />}
              {(marcas.data ?? []).slice(0, MOSTRAR).map((m) => (
                <Resultado key={m.id} texto={m.nombre} onPress={() => cambiar({ marcaId: m.id, marca: m.nombre })} />
              ))}
              {textoMarca.trim().length >= 2 && marcas.data?.length === 0 && (
                <Texto variante="nota" tono="texto3" style={estilos.cargando}>
                  No encontramos esa marca.
                </Texto>
              )}
            </View>
          ) : (
            <Elegido
              etiqueta="Marca"
              texto={f.marca}
              onCambiar={() => {
                setTextoLinea('');
                cambiar({ marcaId: null, marca: '', catalogoLineaId: null, linea: '', cilindradaCc: null });
              }}
            />
          )}

          {f.marcaId !== null &&
            (f.catalogoLineaId === null ? (
              <View>
                <Campo
                  etiqueta="Línea"
                  placeholder="Ej. prado vx"
                  value={textoLinea}
                  onChangeText={setTextoLinea}
                  error={errores.linea}
                  autoCorrect={false}
                  ayuda="Escribe parte del nombre como sale en la tarjeta de propiedad"
                />
                {lineas.isFetching && <ActivityIndicator color={tema.primario} style={estilos.cargando} />}
                {(lineas.data ?? []).slice(0, MOSTRAR).map((linea) => (
                  <Resultado key={linea.id} texto={nombreLinea(linea)} onPress={() => elegirLinea(linea)} />
                ))}
              </View>
            ) : (
              <Elegido
                etiqueta="Línea"
                texto={f.cilindradaCc ? `${f.linea} · ${f.cilindradaCc.toLocaleString('es-CO')} cc` : f.linea}
                onCambiar={() => cambiar({ catalogoLineaId: null, linea: '', cilindradaCc: null })}
              />
            ))}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() =>
          cambiar(
            f.manual
              ? { manual: false, marca: '', linea: '', marcaId: null, catalogoLineaId: null }
              : { manual: true, marcaId: null, catalogoLineaId: null, cilindradaCc: null },
          )
        }
        style={estilos.enlace}>
        <Texto variante="fuerte" tono="primarioTinta" style={{ textDecorationLine: 'underline' }}>
          {f.manual ? 'Buscar en el catálogo' : 'No encuentro mi vehículo'}
        </Texto>
      </Pressable>

      <Campo
        etiqueta="Año modelo"
        placeholder="Ej. 2008"
        keyboardType="number-pad"
        maxLength={4}
        value={f.anio}
        onChangeText={(anio) => cambiar({ anio: anio.replace(/\D/g, '') })}
        error={errores.anio}
        ayuda="Está en la tarjeta de propiedad como Modelo"
      />

      {(f.catalogoLineaId !== null || f.manual) && (
        <View style={estilos.paso}>
          <Texto variante="seccion" tono="texto3">
            Revisa lo que sugerimos
          </Texto>
          <Texto variante="fuerte">Combustible</Texto>
          <Opciones
            etiqueta="Combustible"
            opciones={[
              { valor: 'GASOLINA', texto: 'Gasolina' },
              { valor: 'DIESEL', texto: 'Diésel' },
              { valor: 'HIBRIDO', texto: 'Híbrido' },
              { valor: 'ELECTRICO', texto: 'Eléctrico' },
            ]}
            valor={f.combustible}
            onCambiar={(combustible) => cambiar({ combustible })}
          />
          <Texto variante="fuerte">Caja</Texto>
          <Opciones
            etiqueta="Caja"
            opciones={[
              { valor: 'MECANICA', texto: 'Mecánica' },
              { valor: 'AUTOMATICA', texto: 'Automática' },
            ]}
            valor={f.transmision}
            onCambiar={(transmision) => cambiar({ transmision })}
          />
          {f.tipo === 'CARRO' && (
            <>
              <Texto variante="fuerte">Tracción</Texto>
              <Opciones
                etiqueta="Tracción"
                opciones={[
                  { valor: '4X2', texto: '4x2' },
                  { valor: '4X4', texto: '4x4' },
                  { valor: 'AWD', texto: 'AWD' },
                ]}
                valor={f.traccion}
                onCambiar={(traccion) => cambiar({ traccion })}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { gap: espacio.m },
  resultado: { minHeight: TACTIL_MINIMO, justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 1 },
  elegido: { flexDirection: 'row', alignItems: 'center', borderRadius: radio.l, padding: 14, gap: espacio.s },
  crece: { flex: 1, minWidth: 0 },
  cambiar: { minHeight: TACTIL_MINIMO, justifyContent: 'center', paddingHorizontal: 4 },
  enlace: { minHeight: TACTIL_MINIMO, justifyContent: 'center', alignSelf: 'flex-start' },
  aviso: { borderRadius: radio.l, padding: 12 },
  cargando: { marginTop: 8, fontFamily: fuentes.normal },
});
