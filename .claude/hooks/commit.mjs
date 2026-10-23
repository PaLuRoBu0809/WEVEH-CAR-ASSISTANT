#!/usr/bin/env node
// .claude/hooks/commit.mjs — PreToolUse (Bash|PowerShell): actúa solo si el comando contiene `git commit`.
// exit 2 bloquea el comando y le devuelve el motivo a Claude.
import { readFileSync } from 'node:fs';
import { ARCHIVO_SECRETO, CONVENCIONAL, lineasDeDiff, revisarLineas } from '../../scripts/calidad/reglas.mjs';
import { crearGit } from '../../scripts/calidad/revisar.mjs';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const git = crearGit(root);
let entrada = {};
try { entrada = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* sin entrada */ }
const cmd = String(entrada.tool_input?.command ?? '');
if (!/\bgit\s+commit\b/.test(cmd)) process.exit(0);

const fallas = [];

// 1. En main solo si se pide explícitamente
const rama = git('branch', '--show-current').trim();
const permiteMain = /\bWEVEH_PERMITIR_MAIN=1\b/.test(cmd) || process.env.WEVEH_PERMITIR_MAIN === '1';
if (['main', 'master'].includes(rama) && !permiteMain)
  fallas.push(`Estás en ${rama}: trabaja en dev/... (si el usuario lo pidió, antepone WEVEH_PERMITIR_MAIN=1).`);

// 2. Mensaje con Conventional Commits (heredoc de bash, here-string de PowerShell o -m simple)
const heredoc = /<<-?\s*['"]?(\w+)['"]?\r?\n([\s\S]*?)\r?\n\s*\1/.exec(cmd);
const hereString = /@['"]\r?\n([\s\S]*?)\r?\n['"]@/.exec(cmd);
const simple = /-m\s+(?:"([^"]*)"|'([^']*)')/.exec(cmd);
const cuerpo = heredoc?.[2] ?? hereString?.[1] ?? (simple ? simple[1] ?? simple[2] : null);
const mensaje = cuerpo?.split('\n').find((l) => l.trim())?.trim();
if (mensaje && !CONVENCIONAL.test(mensaje))
  fallas.push(`Mensaje "${mensaje}" no sigue Conventional Commits: tipo(ámbito): descripción (feat|fix|docs|refactor|test|chore|ci|build|perf|style|revert).`);

// 3. Qué se va a commitear: lo preparado, o todo si el comando prepara y commitea (git add / -a / --all)
const todo = /\bgit\s+add\b/.test(cmd) || /\bcommit\b[^\n|;&]*\s(?:-(?!-)[A-Za-z]*a[A-Za-z]*|--all)\b/.test(cmd);
const rango = todo ? ['HEAD'] : ['--cached'];
const archivos = git('diff', ...rango, '--name-only').split('\n').filter(Boolean);
const nuevos = todo ? git('ls-files', '-o', '--exclude-standard').split('\n').filter(Boolean) : [];
for (const f of [...archivos, ...nuevos].filter((f) => ARCHIVO_SECRETO.test(f)))
  fallas.push(`${f}: archivo de secretos; no se commitea (agrégalo a .gitignore).`);
fallas.push(...revisarLineas(lineasDeDiff(git('diff', ...rango, '-U0'))).fallas);

if (fallas.length) {
  process.stderr.write(`Commit bloqueado por WEVEH:\n- ${fallas.join('\n- ')}\n`);
  process.exit(2);
}
process.exit(0);
