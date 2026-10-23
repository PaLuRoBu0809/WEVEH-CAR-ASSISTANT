// scripts/calidad/reglas.mjs — reglas de texto compartidas por los hooks de Claude Code y el CI.
// Para añadir una regla de las skills que se pueda detectar leyendo texto, agrégala aquí.
export const REGLAS = [
  { re: /\b(dispositivoId|DispositivoId|X-Weveh-Dispositivo)\b/, en: /^(backend\/src|mobile\/(src|app))\//,
    msg: 'Identidad por dispositivo: desde el ADR 0005 se filtra por usuarioId del token.' },
  { re: /(sk-or-v1-[A-Za-z0-9]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|service_role_key\s*[=:]\s*\S{20,})/,
    en: /^(?!docs\/)(?!.*\.md$)/, msg: 'Parece una llave o un token dentro del código.' },
  // Hexagonal: el dominio no importa Spring, Jakarta ni JDBC.
  { re: /^\s*import\s+(org\.springframework|jakarta\.|javax\.|java\.sql)/, en: /^backend\/src\/main\/java\/.*\/domain\/.*\.java$/,
    msg: 'El paquete domain no puede importar Spring, Jakarta ni JDBC (arquitectura hexagonal).' },
  { re: /\bconsole\.(log|debug)\(/, en: /^mobile\/(src|app)\/.*\.(ts|tsx)$/, aviso: true,
    msg: 'console.log en la app: quítalo o usa el logger.' },
];

export function revisarLineas(lineas /* [{ f, t }] */) {
  const fallas = [], avisos = [];
  for (const r of REGLAS) {
    const hit = lineas.find((n) => r.en.test(n.f) && r.re.test(n.t));
    if (hit) (r.aviso ? avisos : fallas).push(`${hit.f}: ${r.msg}`);
  }
  return { fallas, avisos };
}

// Convierte la salida de `git diff -U0` en líneas añadidas por archivo.
export function lineasDeDiff(diff) {
  const out = []; let f = null;
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) f = l.startsWith('+++ b/') ? l.slice(6) : null;
    else if (l.startsWith('+') && f) out.push({ f, t: l.slice(1) });
  }
  return out;
}

export const CONVENCIONAL = /^(feat|fix|docs|refactor|test|chore|ci|build|perf|style|revert)(\([\w\-./]+\))?!?: \S.{2,}/;

export const ARCHIVO_SECRETO = /(^|\/)\.env(\.(?!example$|sample$)[\w.-]+)?$|\.(pem|p12|keystore|jks)$|service-account.*\.json$/i;
