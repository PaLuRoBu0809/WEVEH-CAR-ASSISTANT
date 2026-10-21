#!/usr/bin/env node
// .claude/hooks/compuerta.mjs — hook Stop de WEVEH: al terminar un cambio corre las reglas y las pruebas del área tocada.
// exit 2 no deja terminar y le devuelve las fallas a Claude; con avisos sale 0 y los muestra al usuario.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { crearGit, revisarCambios } from '../../scripts/calidad/revisar.mjs';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const win = process.platform === 'win32';
const git = crearGit(root);
const MAX_INTENTOS = 2;
const TOCA_MOBILE = /^(mobile\/(src|app)\/|mobile\/(package(-lock)?\.json|tsconfig\.json|eslint\.config\.js|babel\.config\.js|jest\.config\.\w+)$|contracts\/vectores-)/;
const TOCA_BACKEND = /^(backend\/(src\/|pom\.xml$|mvnw)|contracts\/vectores-)/;

// Pausa explícita (por ejemplo, mientras varios agentes editan en paralelo): no corre nada y lo avisa.
if (existsSync(path.join(root, '.claude', '.compuerta-pausa'))) {
  console.log(JSON.stringify({ systemMessage: 'Verificación de WEVEH en pausa (.claude/.compuerta-pausa). Bórralo para volver a verificar.' }));
  process.exit(0);
}

// ---------- 1. Reglas sobre lo que cambió desde el último commit ----------
const { archivos, fallas, avisos } = revisarCambios({ root });
if (archivos.length === 0) process.exit(0); // turno de solo lectura

// ---------- 2. Huella del estado: no repetir lo ya verificado ----------
const h = createHash('sha1').update(git('status', '--porcelain=v1', '-uall')).update(git('diff', 'HEAD'));
for (const f of git('ls-files', '-o', '--exclude-standard').split('\n').filter(Boolean)) {
  const p = path.join(root, f);
  if (existsSync(p) && statSync(p).size < 1_000_000) h.update(readFileSync(p));
}
const huella = h.digest('hex');
const archivoEstado = path.join(root, '.claude', '.compuerta.json'); // va en .gitignore
let previo = {};
try { previo = JSON.parse(readFileSync(archivoEstado, 'utf8')); } catch { /* primera vez */ }
if (previo.huella === huella && (previo.ok || previo.intentos >= MAX_INTENTOS)) process.exit(0);
const intentos = previo.huella === huella ? previo.intentos : 0;

// ---------- 3. Pruebas del área tocada, en paralelo ----------
const sinAnsi = (s) => s.replaceAll(/\u001b\[[0-9;]*m/g, '');
const correr = (nombre, cmd, args, cwd) =>
  new Promise((listo) => {
    const opts = { cwd, env: process.env };
    const p = win ? spawn([cmd, ...args].join(' '), { ...opts, shell: true }) : spawn(cmd, args, opts);
    let out = '';
    const juntar = (d) => { out = (out + d).slice(-200_000); };
    p.stdout.on('data', juntar);
    p.stderr.on('data', juntar);
    p.on('error', (e) => listo({ nombre, ok: false, out: String(e) }));
    p.on('close', (code) => listo({ nombre, ok: code === 0, out: sinAnsi(out) }));
  });

const tareas = [];
if (archivos.some((f) => TOCA_MOBILE.test(f))) {
  const m = path.join(root, 'mobile');
  if (existsSync(path.join(m, 'node_modules'))) {
    // En serie: lint, tsc y jest en paralelo (más Maven) agotan la memoria
    const enSerie = async () => {
      const resultados = [];
      resultados.push(await correr('mobile lint', 'npm', ['run', 'lint'], m));
      resultados.push(await correr('mobile typecheck', 'npm', ['run', 'typecheck'], m));
      resultados.push(await correr('mobile test', 'npm', ['test', '--', '--ci', '--maxWorkers=50%'], m));
      return resultados;
    };
    tareas.push(enSerie());
  } else avisos.push('mobile/node_modules no existe: corre `npm ci` en mobile/. No corrí las pruebas de la app.');
}
if (archivos.some((f) => TOCA_BACKEND.test(f))) {
  const b = path.join(root, 'backend');
  const dockerArriba = (win
    ? spawnSync('docker info', { stdio: 'ignore', shell: true, timeout: 20_000 })
    : spawnSync('docker', ['info'], { stdio: 'ignore', timeout: 20_000 })).status === 0;
  if (!existsSync(path.join(b, win ? 'mvnw.cmd' : 'mvnw'))) avisos.push('No encontré backend/mvnw: no corrí las pruebas del backend.');
  else if (dockerArriba) tareas.push(correr('backend test', win ? 'mvnw.cmd' : './mvnw', ['-B', '-q', 'test'], b));
  else avisos.push('Docker no está corriendo: enciende Docker Desktop (Testcontainers lo necesita). No corrí las pruebas del backend.');
}
for (const r of (await Promise.all(tareas)).flat()) {
  if (r.ok) continue;
  const lineas = r.out.split('\n');
  const clave = lineas.filter((l) => /ERROR|FAIL|✕|error TS|Tests run:.*(Failures|Errors): [1-9]/.test(l));
  fallas.push(`${r.nombre} falló:\n${(clave.length ? clave : lineas).slice(-30).join('\n')}`);
}

// ---------- 4. Resultado ----------
const ok = fallas.length === 0;
writeFileSync(archivoEstado, JSON.stringify({ huella, ok, intentos: ok ? 0 : intentos + 1 }));
const textoAvisos = avisos.length ? `\n\nAvisos:\n- ${avisos.join('\n- ')}` : '';
if (!ok) {
  const nota = intentos + 1 >= MAX_INTENTOS
    ? '\n(Es el segundo intento con este mismo código: si no se puede arreglar, díselo al usuario.)'
    : '';
  process.stderr.write(`Verificación de WEVEH no pasó:\n\n- ${fallas.join('\n\n- ')}${textoAvisos}${nota}\n`);
  process.exit(2);
}
if (avisos.length) console.log(JSON.stringify({ systemMessage: `Avisos de WEVEH:\n- ${avisos.join('\n- ')}` }));
process.exit(0);
