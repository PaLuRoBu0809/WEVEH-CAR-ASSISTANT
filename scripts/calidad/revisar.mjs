#!/usr/bin/env node
// scripts/calidad/revisar.mjs — reglas de estructura sobre un conjunto de cambios.
// Lo usan el hook Stop (cambios sin commit contra HEAD) y el CI (`node scripts/calidad/revisar.mjs origin/main`).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ARCHIVO_SECRETO, lineasDeDiff, revisarLineas } from './reglas.mjs';

const MIGRACION = /^backend\/src\/main\/resources\/db\/migration\/V\d+__[\w-]+\.sql$/;
// §8.8 pide evals por cambios de prompt o de modelo; un refactor del cliente HTTP no cuenta.
const PROMPT = /^backend\/src\/main\/resources\/prompts\//;
const CONFIG_IA = /^backend\/src\/main\/resources\/application[\w-]*\.ya?ml$/;
const ESTADO_HOOK = '.claude/.compuerta.json';
const esc = (s) => s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export const crearGit = (root) => (...a) =>
  execFileSync('git', ['-c', 'core.quotepath=off', ...a],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });

const leible = (p) => existsSync(p) && statSync(p).isFile() && statSync(p).size < 1_000_000;

function revisarSecretos({ root, archivos }) {
  return archivos
    .filter((f) => ARCHIVO_SECRETO.test(f) && existsSync(path.join(root, f)))
    .map((f) => `${f}: archivo de secretos; no se versiona (agrégalo a .gitignore).`);
}

// Flyway: una migración ya versionada no se toca; las tablas nuevas llevan RLS (CLAUDE.md §3)
function revisarMigraciones({ root, archivos, existeEnBase }) {
  const fallas = [];
  for (const f of archivos.filter((f) => MIGRACION.test(f))) {
    if (existeEnBase(f)) {
      fallas.push(`${f}: no edites ni borres una migración ya versionada; crea la siguiente V.`);
      continue;
    }
    const p = path.join(root, f);
    if (!leible(p)) continue;
    const sql = readFileSync(p, 'utf8');
    for (const [, tabla] of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)/gi)) {
      const rls = new RegExp(String.raw`alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?${esc(tabla)}\s+enable\s+row\s+level\s+security`, 'i');
      if (!rls.test(sql)) fallas.push(`${f}: la tabla ${tabla} no tiene ENABLE ROW LEVEL SECURITY.`);
    }
  }
  return fallas;
}

function revisarEvals({ archivos, lineas }) {
  const tocaIA = archivos.some((f) => PROMPT.test(f))
    || lineas.some((n) => CONFIG_IA.test(n.f) && n.t.includes('WEVEH_IA_MODELO'));
  if (!tocaIA || archivos.includes('evals/results.md')) return [];
  return ['Cambió un prompt o la lista de modelos y evals/results.md no cambió (§8.8). Corre los evals y anótalos.'];
}

function avisosSdd({ archivos, existeEnBase }) {
  const avisos = [];
  const codigoNuevo = archivos.some((f) => /^(backend\/src\/main|mobile\/src)\//.test(f) && !existeEnBase(f));
  if (codigoNuevo && !archivos.includes('docs/tareas.md')) avisos.push('Hay código nuevo y docs/tareas.md no cambió.');
  const tocaControlador = archivos.some((f) => f.endsWith('Controller.java'));
  if (tocaControlador && !archivos.some((f) => ['contracts/openapi.yaml', 'docs/api.md'].includes(f)))
    avisos.push('Cambió un controlador y no se tocó contracts/openapi.yaml ni docs/api.md.');
  return avisos;
}

// local: cambios sin commit (incluye archivos nuevos) contra HEAD. Si no, lo commiteado desde la base.
export function revisarCambios({ root, base = 'HEAD', local = true }) {
  const git = crearGit(root);
  const ref = local ? 'HEAD' : git('merge-base', base, 'HEAD').trim();

  const sinRastrear = local ? git('ls-files', '-o', '--exclude-standard').split('\n').filter(Boolean) : [];
  const archivos = [...git('diff', '--no-renames', '--name-only', ref).split('\n').filter(Boolean), ...sinRastrear]
    .filter((f) => f !== ESTADO_HOOK);

  const lineas = lineasDeDiff(git('diff', '--no-renames', '-U0', ref));
  for (const f of sinRastrear) {
    const p = path.join(root, f);
    if (leible(p)) readFileSync(p, 'utf8').split('\n').forEach((t) => lineas.push({ f, t }));
  }

  const existeEnBase = (f) => {
    try { git('cat-file', '-e', `${ref}:${f}`); return true; } catch { return false; }
  };
  const contexto = { root, archivos, lineas, existeEnBase };
  const deTexto = revisarLineas(lineas);
  const fallas = [
    ...deTexto.fallas,
    ...revisarSecretos(contexto),
    ...revisarMigraciones(contexto),
    ...revisarEvals(contexto),
  ];
  const avisos = [...deTexto.avisos, ...avisosSdd(contexto)];
  return { archivos, fallas, avisos };
}

// Uso desde el CI: node scripts/calidad/revisar.mjs [base]
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const root = crearGit(process.cwd())('rev-parse', '--show-toplevel').trim();
  const base = process.argv[2] ?? 'origin/main';
  let resultado;
  try {
    resultado = revisarCambios({ root, base, local: false });
  } catch (e) {
    console.log(`::error::No pude comparar contra ${base}: ${String(e.stderr ?? e.message).trim()}`);
    process.exit(1);
  }
  const { archivos, fallas, avisos } = resultado;
  console.log(`Revisados ${archivos.length} archivos cambiados contra ${base}.`);
  for (const a of avisos) console.log(`::warning::${a}`);
  for (const f of fallas) console.log(`::error::${f}`);
  if (fallas.length) process.exit(1);
  console.log('Reglas de WEVEH: sin fallas.');
}
