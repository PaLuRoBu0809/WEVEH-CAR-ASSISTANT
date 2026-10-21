#!/usr/bin/env python3
"""Genera el SQL que actualiza combustible, transmisión y tracción de catalogo.linea con la capa 0 (ADR 0021).

No se conecta a ninguna base: escribe un .sql que el equipo revisa y corre en Supabase **después de la migración V8**
(que amplía el CHECK de combustible a GASOLINA, GAS e HIBRIDO_ENCHUFABLE). Empareja cada línea por la clave única de
V2 (marca normalizada, línea normalizada, cilindrada, potencia, clase), no por id, y solo cambia las filas cuyo valor
es distinto. No borra ni agrega líneas (ADR 0014).

Uso (desde la raíz del repo):
  python scripts/catalogo/actualizar_atributos.py datos/mintransporte/2025/*.xlsx
  → datos/catalogo/2025/actualizar_atributos.sql
"""
import argparse
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "plugins" / "weveh-dev" / "skills" / "catalogo-vehiculos" / "scripts"))
import importar_catalogo as catalogo  # noqa: E402

FILAS_POR_INSERT = 1000


def literal(valor) -> str:
    if valor is None:
        return "null"
    if isinstance(valor, (int, float)):
        return str(valor)
    return "'" + str(valor).replace("'", "''") + "'"


def fila_sql(linea, marca_normalizada) -> str:
    valores = (marca_normalizada, linea["nombre_normalizado"], linea["cilindrada_cc"], linea["potencia_kw"], linea["clase"],
               linea["combustible"], linea["transmision"], linea["traccion"])
    return "(" + ", ".join(literal(v) for v in valores) + ")"


def generar_sql(datos) -> str:
    marca_por_id = {m["id"]: m["nombre_normalizado"] for m in datos["marcas"].values()}
    lineas = list(datos["lineas"].values())
    partes = [
        "-- Generado por scripts/catalogo/actualizar_atributos.py (capa 0, ADR 0021). Correr después de V8.",
        "begin;",
        "create temp table atributos_capa0 (marca text, linea text, cilindrada_cc int, potencia_kw numeric(6, 2), clase text,",
        "  combustible text, transmision text, traccion text) on commit drop;",
    ]
    for inicio in range(0, len(lineas), FILAS_POR_INSERT):
        bloque = lineas[inicio:inicio + FILAS_POR_INSERT]
        filas = ",\n  ".join(fila_sql(linea, marca_por_id[linea["marca_id"]]) for linea in bloque)
        partes.append(f"insert into atributos_capa0 values\n  {filas};")
    partes += [
        "",
        "-- Control: si alguna línea del archivo no existe en la base, se aborta todo (el catálogo cargado no es el mismo).",
        "do $$",
        "declare sin_pareja int;",
        "begin",
        "  select count(*) into sin_pareja from atributos_capa0 a",
        "  where not exists (select 1 from catalogo.linea l join catalogo.marca m on m.id = l.marca_id",
        "    where m.nombre_normalizado = a.marca and l.nombre_normalizado = a.linea and l.clase = a.clase",
        "      and l.cilindrada_cc is not distinct from a.cilindrada_cc and l.potencia_kw is not distinct from a.potencia_kw);",
        "  if sin_pareja > 0 then",
        "    raise exception '% líneas del archivo no existen en catalogo.linea; no se cambió nada', sin_pareja;",
        "  end if;",
        "end $$;",
        "",
        "update catalogo.linea l",
        "set combustible = a.combustible, transmision = a.transmision, traccion = a.traccion",
        "from atributos_capa0 a join catalogo.marca m on m.nombre_normalizado = a.marca",
        "where l.marca_id = m.id and l.nombre_normalizado = a.linea and l.clase = a.clase",
        "  and l.cilindrada_cc is not distinct from a.cilindrada_cc and l.potencia_kw is not distinct from a.potencia_kw",
        "  and (l.combustible, l.transmision, l.traccion) is distinct from (a.combustible, a.transmision, a.traccion);",
        "commit;",
        "",
        "-- Verificación (RF-CAT-05): cobertura por tipo. Línea base antes de este script: carros 3,6 / 51,1 / 11,8; motos 3,6 / 39,4 / 3,0.",
        "select tipo_vehiculo, count(*) as lineas,",
        "  round(100.0 * count(combustible) / count(*), 1) as pct_combustible,",
        "  round(100.0 * count(transmision) / count(*), 1) as pct_transmision,",
        "  round(100.0 * count(traccion) / count(*), 1) as pct_traccion",
        "from catalogo.linea where not es_generica group by tipo_vehiculo order by 1;",
    ]
    return "\n".join(partes) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("excel", nargs="+", type=Path)
    parser.add_argument("--salida", type=Path, help="archivo .sql (por defecto datos/catalogo/<año>/actualizar_atributos.sql)")
    args = parser.parse_args()

    datos = catalogo.construir_catalogo(args.excel)
    anio = next((l["anio_fiscal"] for l in datos["lineas"].values() if l["anio_fiscal"]), "sin-anio")
    salida = args.salida or RAIZ / "datos" / "catalogo" / str(anio) / "actualizar_atributos.sql"
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(generar_sql(datos), encoding="utf-8")

    cobertura = catalogo.cobertura(list(datos["lineas"].values()))["por_tipo"]
    print(f"Escribí {salida} con {len(datos['lineas'])} líneas.")
    print("Cobertura esperada después de correrlo (líneas no genéricas):")
    for tipo, valores in cobertura.items():
        print(f"  {tipo}: {valores}")


if __name__ == "__main__":
    main()
