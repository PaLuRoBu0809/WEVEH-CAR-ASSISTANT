#!/usr/bin/env python3
"""Valida un lote de atributos investigados en la web por familia (capa 1, ADR 0021) y genera su SQL de carga.

Cada línea del JSONL es una familia y cilindrada:
  {"marca": "CHEVROLET", "familia": "CORSA", "cilindrada_cc": 1389, "combustible": "GASOLINA",
   "tracciones": ["4X2"], "transmisiones": ["MECANICA"], "fuente_url": "https://...", "cita": "texto copiado de la fuente",
   "tipo_fuente": "FABRICANTE", "fecha": "2026-10-21",
   "segunda_fuente_url": "https://...", "segundo_tipo_fuente": "PRENSA"}   ← las dos últimas son opcionales

Reglas (RF-CAT-05):
- Valores dentro de los enums; vacío = sin dato (nunca se inventa).
- Fuente: URL y cita obligatorias. Basta una fuente si es FABRICANTE o CONCESIONARIO; si no, hace falta una segunda
  fuente de otro dominio, y un FORO nunca cuenta solo.
- La familia (marca + primera palabra de la línea) y la cilindrada deben existir en los Excel del Ministerio.
- No puede contradecir la capa 0: si el nombre de la línea ya dice el valor, el lote debe coincidir.
- Se elige al azar (con semilla) el 10 % de los registros para que el equipo los revise contra la fuente.

Salida: errores (código 1 si hay), la muestra a revisar y un .sql que carga catalogo.atributo_linea con origen IA_WEB,
verificada = false y el lote. Tras la revisión, el equipo corre el UPDATE que se imprime al final.

Uso (desde la raíz del repo):
  python scripts/catalogo/validar_lote.py lote.jsonl --lote piloto-2026-10 --excel datos/mintransporte/2025/*.xlsx
  [--semilla 2026] [--verificar-urls]
"""
import argparse
import json
import math
import random
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlparse

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "plugins" / "weveh-dev" / "skills" / "catalogo-vehiculos" / "scripts"))
import importar_catalogo as catalogo  # noqa: E402

COMBUSTIBLES = {"GASOLINA", "DIESEL", "GAS", "HIBRIDO", "HIBRIDO_ENCHUFABLE", "ELECTRICO"}
TRACCIONES = {"4X2", "4X4", "AWD"}
TRANSMISIONES = {"AUTOMATICA", "MECANICA"}
TIPOS_FUENTE = {"FABRICANTE", "CONCESIONARIO", "FICHA_TECNICA", "PRENSA", "FORO"}
FUENTES_SUFICIENTES_SOLAS = {"FABRICANTE", "CONCESIONARIO"}
PORCENTAJE_MUESTRA = 0.10
SEGUNDOS_POR_URL = 15


def familia_de(nombre_linea: str) -> str:
    palabras = re.findall(r"[A-Z0-9\-]+", catalogo.sin_tildes(nombre_linea).upper())
    return palabras[0] if palabras else ""


def dominio(url: str) -> str:
    return (urlparse(url).hostname or "").removeprefix("www.")


def indexar_familias(datos):
    """(marca normalizada, familia) → {cilindrada: [líneas]} con las líneas no genéricas del catálogo."""
    marca_por_id = {m["id"]: m for m in datos["marcas"].values()}
    familias = defaultdict(lambda: defaultdict(list))
    for linea in datos["lineas"].values():
        if linea["es_generica"]:
            continue
        marca = marca_por_id[linea["marca_id"]]
        familias[(marca["nombre_normalizado"], familia_de(linea["nombre"]))][linea["cilindrada_cc"]].append(
            {**linea, "marca_normalizada": marca["nombre_normalizado"]})
    return familias


def errores_de_fuente(registro):
    errores = []
    url, tipo = registro.get("fuente_url") or "", registro.get("tipo_fuente")
    if not re.match(r"https?://", url):
        errores.append("falta fuente_url (http/https)")
    if not (registro.get("cita") or "").strip():
        errores.append("falta la cita copiada de la fuente")
    if tipo not in TIPOS_FUENTE:
        errores.append(f"tipo_fuente '{tipo}' no es uno de {sorted(TIPOS_FUENTE)}")
    if tipo in FUENTES_SUFICIENTES_SOLAS:
        return errores
    segunda, segundo_tipo = registro.get("segunda_fuente_url") or "", registro.get("segundo_tipo_fuente")
    if not re.match(r"https?://", segunda):
        errores.append(f"una fuente {tipo} no basta sola: falta segunda_fuente_url")
    elif dominio(segunda) == dominio(url):
        errores.append("las dos fuentes son del mismo dominio: no son independientes")
    if segundo_tipo not in TIPOS_FUENTE:
        errores.append("falta segundo_tipo_fuente válido")
    if tipo == "FORO" and segundo_tipo == "FORO":
        errores.append("dos foros no bastan: hace falta una fuente que no sea foro")
    return errores


def errores_de_valores(registro):
    errores = []
    combustible = registro.get("combustible")
    if combustible is not None and combustible not in COMBUSTIBLES:
        errores.append(f"combustible '{combustible}' no válido")
    for campo, permitidos in (("tracciones", TRACCIONES), ("transmisiones", TRANSMISIONES)):
        valores = registro.get(campo) or []
        if not isinstance(valores, list) or set(valores) - permitidos:
            errores.append(f"{campo} {valores} fuera de {sorted(permitidos)}")
    if combustible is None and not registro.get("tracciones") and not registro.get("transmisiones"):
        errores.append("el registro no trae ningún dato")
    return errores


def errores_de_capa0(registro, lineas):
    """El lote no puede contradecir lo que el nombre de la línea ya dice."""
    errores = []
    for linea in lineas:
        if registro.get("combustible") and linea["combustible"] and linea["combustible"] != registro["combustible"]:
            errores.append(f"'{linea['nombre']}' dice {linea['combustible']} y el lote {registro['combustible']}")
        if registro.get("tracciones") and linea["traccion"] and linea["traccion"] not in registro["tracciones"]:
            errores.append(f"'{linea['nombre']}' dice {linea['traccion']} y el lote {registro['tracciones']}")
        if registro.get("transmisiones") and linea["transmision"] and linea["transmision"] not in registro["transmisiones"]:
            errores.append(f"'{linea['nombre']}' dice {linea['transmision']} y el lote {registro['transmisiones']}")
    return errores


def url_responde(url: str) -> bool:
    peticion = urllib.request.Request(url, method="GET", headers={"User-Agent": "weveh-validar-lote/1.0"})
    try:
        with urllib.request.urlopen(peticion, timeout=SEGUNDOS_POR_URL) as respuesta:
            return respuesta.status < 400
    except Exception:  # noqa: BLE001 — cualquier falla de red cuenta como "no responde"
        return False


def literal(valor) -> str:
    if valor is None:
        return "null"
    if isinstance(valor, list):
        return "array[" + ", ".join(literal(v) for v in valor) + "]::text[]"
    if isinstance(valor, (int, float)):
        return str(valor)
    return "'" + str(valor).replace("'", "''") + "'"


def filas_de_carga(registro, lineas):
    """Una fila por línea y atributo que la capa 0 no resolvió (la capa 0 gana y no se duplica)."""
    por_atributo = {
        "combustible": [registro["combustible"]] if registro.get("combustible") else [],
        "transmision": registro.get("transmisiones") or [],
        "traccion": registro.get("tracciones") or [],
    }
    filas = []
    for linea in lineas:
        for atributo, valores in por_atributo.items():
            if valores and not linea[atributo]:
                filas.append((linea, atributo, sorted(valores)))
    return filas


def generar_sql(cargas, lote: str) -> str:
    valores = ",\n  ".join(
        "(" + ", ".join(literal(v) for v in (
            linea["marca_normalizada"], linea["nombre_normalizado"], linea["cilindrada_cc"], linea["potencia_kw"], linea["clase"],
            atributo, valores_atributo, registro["fuente_url"], registro["cita"], registro["tipo_fuente"])) + ")"
        for registro, linea, atributo, valores_atributo in cargas)
    return "\n".join([
        f"-- Lote {lote} de la capa 1 (ADR 0021), generado por scripts/catalogo/validar_lote.py. Requiere V8.",
        "begin;",
        "insert into catalogo.atributo_linea (linea_id, atributo, valores, origen, fuente_url, cita, tipo_fuente, verificada, lote)",
        f"select l.id, upper(v.atributo), v.valores, 'IA_WEB', v.fuente_url, v.cita, v.tipo_fuente, false, {literal(lote)}",
        "from (values",
        f"  {valores}",
        ") as v(marca, linea, cilindrada_cc, potencia_kw, clase, atributo, valores, fuente_url, cita, tipo_fuente)",
        "join catalogo.marca m on m.nombre_normalizado = v.marca",
        "join catalogo.linea l on l.marca_id = m.id and l.nombre_normalizado = v.linea and l.clase = v.clase",
        "  and l.cilindrada_cc is not distinct from v.cilindrada_cc::int and l.potencia_kw is not distinct from v.potencia_kw::numeric;",
        "commit;",
        "",
        "-- Deshacer el lote completo si la revisión lo rechaza:",
        f"-- delete from catalogo.atributo_linea where lote = {literal(lote)};",
        "",
    ])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("jsonl", type=Path)
    parser.add_argument("--lote", required=True)
    parser.add_argument("--excel", nargs="+", type=Path, required=True)
    parser.add_argument("--semilla", type=int, default=2026)
    parser.add_argument("--verificar-urls", action="store_true", help="pide cada URL y falla si no responde")
    parser.add_argument("--salida", type=Path, help="carpeta de salida (por defecto datos/catalogo/lotes/<lote>/)")
    args = parser.parse_args()

    familias = indexar_familias(catalogo.construir_catalogo(args.excel))
    registros = [json.loads(texto) for texto in args.jsonl.read_text(encoding="utf-8").splitlines() if texto.strip()]
    errores, cargas = [], []
    for numero, registro in enumerate(registros, start=1):
        marca = catalogo.normalizar(registro.get("marca", ""))
        familia = familia_de(registro.get("familia", ""))
        etiqueta = f"#{numero} {registro.get('marca')} {registro.get('familia')} {registro.get('cilindrada_cc')} cc"
        propios = errores_de_fuente(registro) + errores_de_valores(registro)
        cilindradas = familias.get((marca, familia))
        if not cilindradas:
            propios.append(f"la familia '{marca} {familia}' no existe en el catálogo")
        elif registro.get("cilindrada_cc") not in cilindradas:
            propios.append(f"la cilindrada {registro.get('cilindrada_cc')} no existe en esa familia ({sorted(c for c in cilindradas if c)})")
        else:
            lineas = cilindradas[registro["cilindrada_cc"]]
            propios += errores_de_capa0(registro, lineas)
            cargas += [(registro, linea, atributo, valores) for linea, atributo, valores in filas_de_carga(registro, lineas)]
        if args.verificar_urls and registro.get("fuente_url") and not url_responde(registro["fuente_url"]):
            propios.append(f"la URL no responde: {registro['fuente_url']}")
        errores += [f"{etiqueta}: {error}" for error in propios]

    if errores:
        print(f"{len(errores)} errores en {args.jsonl}:")
        print("\n".join(f"  - {error}" for error in errores))
        sys.exit(1)

    salida = args.salida or RAIZ / "datos" / "catalogo" / "lotes" / args.lote
    salida.mkdir(parents=True, exist_ok=True)
    tamano = max(1, math.ceil(len(registros) * PORCENTAJE_MUESTRA))
    muestra = random.Random(args.semilla).sample(registros, tamano)
    (salida / "muestra_revision.json").write_text(json.dumps(muestra, ensure_ascii=False, indent=2), encoding="utf-8")
    (salida / "carga.sql").write_text(generar_sql(cargas, args.lote), encoding="utf-8")

    print(f"Lote {args.lote}: {len(registros)} registros válidos → {len(cargas)} filas para catalogo.atributo_linea.")
    print(f"Muestra para revisar contra la fuente ({tamano}, semilla {args.semilla}): {salida / 'muestra_revision.json'}")
    for registro in muestra:
        print(f"  - {registro['marca']} {registro['familia']} {registro['cilindrada_cc']} cc → {registro['fuente_url']}")
    print(f"SQL de carga: {salida / 'carga.sql'}")
    print("\nCuando el equipo apruebe la muestra, marcar el lote como verificado:")
    print(f"  update catalogo.atributo_linea set verificada = true, revisado_en = now() where lote = {literal(args.lote)};")


if __name__ == "__main__":
    main()
