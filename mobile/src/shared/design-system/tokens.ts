/**
 * Tokens de los mockups "WEVEH Garaje.html" y "WEVEH Portada.html".
 * El teal es lo único tocable. Siempre abre en claro; el oscuro se elige en Perfil o con la luna.
 */
export const colores = {
  claro: {
    fondo: '#FFFFFF',
    superficie: '#F3F6F5',
    linea: '#DCE5E3',
    texto: '#0E1F1D',
    texto2: '#41554F',
    texto3: '#5A6E6A',
    primario: '#005F54',
    primarioPresionado: '#004A42',
    sobrePrimario: '#FFFFFF',
    primarioTinte: '#E2F1EE',
    primarioTinta: '#005F54',
    ok: '#1E7A46',
    okTinte: '#E5F4EA',
    okTinta: '#17693A',
    alerta: '#F9E03F',
    alertaTinte: '#FFF5C2',
    alertaTinta: '#6F5200',
    error: '#C9302C',
    errorTinte: '#FCE9E7',
    errorTinta: '#A5231F',
    pista: '#AEBFBB',
    campo: '#7F9591',
    barraOk: '#2F9E5F',
    barraError: '#A61B1B',
    barraAlerta: '#8F6B00',
    avisoFondo: '#0E1F1D',
    avisoTinta: '#EAF3F1',
    avisoAccion: '#6FE5D2',
    velo: 'rgba(6,18,17,0.45)',
  },
  oscuro: {
    fondo: '#0B1514',
    superficie: '#112220',
    linea: '#22403C',
    texto: '#EAF3F1',
    texto2: '#B3C7C3',
    texto3: '#93A9A5',
    primario: '#3CCFB6',
    primarioPresionado: '#2AB29B',
    sobrePrimario: '#03211D',
    primarioTinte: '#12403A',
    primarioTinta: '#5FDCC8',
    ok: '#4CD07D',
    okTinte: '#12391F',
    okTinta: '#6FE29B',
    alerta: '#F9E03F',
    alertaTinte: '#3B3300',
    alertaTinta: '#FFE680',
    error: '#FF7A72',
    errorTinte: '#451A18',
    errorTinta: '#FF9A93',
    pista: '#43685F',
    campo: '#6A8984',
    barraOk: '#7BD66A',
    barraError: '#FF6B63',
    barraAlerta: '#F9E03F',
    avisoFondo: '#EAF3F1',
    avisoTinta: '#0B1514',
    avisoAccion: '#005F54',
    velo: 'rgba(6,18,17,0.45)',
  },
} as const;

export type Paleta = { readonly [K in keyof typeof colores.claro]: string };

/** Colores de la marca: las escenas (encendido, portada) son siempre oscuras. */
export const marca = {
  escena: '#0A1413',
  cielo: '#00120F',
  cieloMedio: '#00403A',
  horizonte: '#0A7A69',
  tealProfundo: '#005F54',
  tealOscuro: '#00332E',
  tealBrillo: '#007A6C',
  sol: '#FFB000',
  menta: '#3DBBA9',
  mentaBoton: '#3CCFB6',
  mentaBotonPresionado: '#2AB29B',
  sobreMenta: '#03211D',
  textoEscena: '#EAF3F1',
  textoEscena2: '#BFE7E0',
} as const;

export const espacio = { xs: 4, s: 8, sm: 12, m: 16, l: 20, xl: 24, xxl: 32 } as const;

export const radio = { s: 12, m: 14, l: 16, xl: 20, hoja: 28, total: 999 } as const;

export const fuentes = {
  normal: 'Manrope_500Medium',
  semi: 'Manrope_600SemiBold',
  negrita: 'Manrope_700Bold',
  extra: 'Manrope_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoNegrita: 'JetBrainsMono_700Bold',
} as const;

export const tipografia = {
  titulo: { fontFamily: fuentes.negrita, fontSize: 28, lineHeight: 32 },
  tituloEscena: { fontFamily: fuentes.extra, fontSize: 32, lineHeight: 35, letterSpacing: -0.6 },
  subtitulo: { fontFamily: fuentes.negrita, fontSize: 17, lineHeight: 21 },
  seccion: { fontFamily: fuentes.negrita, fontSize: 14, letterSpacing: 0.84, textTransform: 'uppercase' },
  cuerpo: { fontFamily: fuentes.normal, fontSize: 15, lineHeight: 22 },
  fuerte: { fontFamily: fuentes.negrita, fontSize: 15, lineHeight: 22 },
  nota: { fontFamily: fuentes.normal, fontSize: 14, lineHeight: 20 },
  mono: { fontFamily: fuentes.mono, fontSize: 14 },
} as const;

/** Objetivo táctil mínimo en pt (RNF-13). */
export const TACTIL_MINIMO = 44;
