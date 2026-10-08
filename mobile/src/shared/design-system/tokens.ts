/** Tokens de marca de los mockups: teal sobre fondo oscuro y punto ámbar. */
export const colores = {
  oscuro: {
    fondo: '#0E1417',
    superficie: '#172126',
    borde: '#26343B',
    texto: '#F2F5F6',
    textoSuave: '#9AA9B0',
    accion: '#3CCFB6',
    textoSobreAccion: '#06221D',
    porVencer: '#F5B83D',
    vencido: '#FF6B5E',
    alDia: '#3CCFB6',
  },
  claro: {
    fondo: '#F7F9FA',
    superficie: '#FFFFFF',
    borde: '#D9E1E4',
    texto: '#0E1417',
    textoSuave: '#4F5F66',
    accion: '#0F7F6E',
    textoSobreAccion: '#FFFFFF',
    porVencer: '#9A6400',
    vencido: '#C62F22',
    alDia: '#0F7F6E',
  },
} as const;

export type Paleta = { readonly [K in keyof typeof colores.oscuro]: string };

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;

export const radio = { s: 8, m: 14, l: 24, total: 999 } as const;

export const tipografia = {
  titulo: { fontSize: 28, fontWeight: '700' },
  subtitulo: { fontSize: 20, fontWeight: '600' },
  cuerpo: { fontSize: 16, fontWeight: '400' },
  nota: { fontSize: 14, fontWeight: '400' },
} as const;

/** Objetivo táctil mínimo en pt (RNF-13). */
export const TACTIL_MINIMO = 44;
