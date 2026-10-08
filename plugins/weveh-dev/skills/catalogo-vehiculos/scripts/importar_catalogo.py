#!/usr/bin/env python3
"""Convierte las tablas de base gravable del Ministerio de Transporte en CSVs para catalogo.marca y catalogo.linea.

Uso:
  python3 importar_catalogo.py --salida salida_catalogo/ "Tabla 1.- Automóviles.xlsx" "Tabla 2.- Camionetas y Camperos.xlsx" ...

Formato esperado de cada Excel (una hoja "Bases Gravables"):
  fila con el título "TABLA N.- BASE GRAVABLE ... PARA EL AÑO FISCAL AAAA"
  fila de encabezado con '#', 'CTR', 'ID', 'FECHA', 'PROYECCION', 'TIPO (1)', 'CLASE (2)', 'MARCA (3)', 'LINEA (4)',
  'CILINDRAJE (5)', 'CAPACIDAD (6)', 'AÑO MODELO (7)'
  fila siguiente con 'TONELAJE', 'PASAJEROS' y los años modelo (2000, 2001, ...)
  una fila por línea con el avalúo en miles de pesos para cada año modelo.

Requiere: openpyxl.
"""
import argparse
import csv
import difflib
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import openpyxl

FILAS_A_BUSCAR_ENCABEZADO = 15
COLUMNAS = {
    "codigo": "ID",
    "tipo": "TIPO",
    "clase": "CLASE",
    "marca": "MARCA",
    "linea": "LINEA",
    "cilindraje": "CILINDRAJE",
    "capacidad": "CAPACIDAD",
}
MARCADORES_LINEA_GENERICA = ("NO INCLUIDOS", "SIN LINEA")
CILINDRADA_MINIMA_REAL_CC = 10
SIMILITUD_MARCA_SOSPECHOSA = 0.88

PATRON_DIESEL = re.compile(r"\b(DIESEL|TDI|CRDI|TD|HDI|DCI|D-4D)\b")
PATRON_AUTOMATICA = re.compile(r"\b(AT|CVT|AUT|AUTOMATICA|AUTOMATICO|TIPTRONIC|DSG|DCT|STEPTRONIC)\b")
PATRON_MECANICA = re.compile(r"\b(MT|MEC|MECANICA|MECANICO)\b")
PATRON_4X4 = re.compile(r"\b(4X4|4WD)\b")
PATRON_AWD = re.compile(r"\bAWD\b")
PATRON_4X2 = re.compile(r"\b4X2\b")
PATRON_PUERTAS = re.compile(r"\b([2-5])\s?P\b")
PATRON_KW = re.compile(r"(\d+(?:[.,]\d+)?)\s*KW", re.IGNORECASE)
PATRON_ANIO_FISCAL = re.compile(r"A[ÑN]O FISCAL (\d{4})")
PATRON_TABLA = re.compile(r"TABLA\s+(\d+)")


def sin_tildes(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")


def limpiar(valor) -> str:
    if valor is None:
        return ""
    return re.sub(r"\s+", " ", str(valor)).strip()


def normalizar(valor) -> str:
    return sin_tildes(limpiar(valor)).lower()


def buscar_encabezado(filas):
    for indice, fila in enumerate(filas[:FILAS_A_BUSCAR_ENCABEZADO]):
        celdas = [normalizar(c).upper() for c in fila]
        if any(c.startswith("MARCA") for c in celdas) and any(c.startswith("LINEA") for c in celdas):
            return indice
    sys.exit("No encontré la fila de encabezado (MARCA / LINEA) en las primeras filas.")


def ubicar_columnas(encabezado):
    posiciones = {}
    celdas = [normalizar(c).upper() for c in encabezado]
    for campo, prefijo in COLUMNAS.items():
        for indice, celda in enumerate(celdas):
            if celda.startswith(prefijo):
                posiciones[campo] = indice
                break
    faltantes = [campo for campo in ("marca", "linea", "cilindraje") if campo not in posiciones]
    if faltantes:
        sys.exit(f"Faltan columnas en el encabezado: {faltantes}")
    return posiciones


def ubicar_anios(fila_anios):
    return {indice: int(valor) for indice, valor in enumerate(fila_anios) if isinstance(valor, (int, float)) and 1900 < valor < 2100}


def leer_cilindraje(valor):
    """Devuelve (cilindrada_cc, potencia_kw). Los eléctricos traen '1,2 KW'; las filas genéricas traen 1."""
    if valor is None:
        return None, None
    if isinstance(valor, (int, float)):
        return (int(valor), None) if valor >= CILINDRADA_MINIMA_REAL_CC else (None, None)
    texto = limpiar(valor)
    coincidencia_kw = PATRON_KW.search(texto)
    if coincidencia_kw:
        return None, float(coincidencia_kw.group(1).replace(",", "."))
    coincidencia = re.search(r"\d+", texto)
    if coincidencia and int(coincidencia.group(0)) >= CILINDRADA_MINIMA_REAL_CC:
        return int(coincidencia.group(0)), None
    return None, None


def inferir_combustible(linea_mayus, clase_mayus, numero_tabla, potencia_kw):
    if potencia_kw is not None or "ELECTRIC" in clase_mayus or "ELECTRICA" in linea_mayus:
        return "ELECTRICO"
    if numero_tabla == 9:
        return "HIBRIDO"
    if PATRON_DIESEL.search(linea_mayus):
        return "DIESEL"
    return None


def inferir_transmision(linea_mayus):
    if PATRON_AUTOMATICA.search(linea_mayus):
        return "AUTOMATICA"
    if PATRON_MECANICA.search(linea_mayus):
        return "MECANICA"
    return None


def inferir_traccion(linea_mayus):
    if PATRON_AWD.search(linea_mayus):
        return "AWD"
    if PATRON_4X4.search(linea_mayus):
        return "4X4"
    if PATRON_4X2.search(linea_mayus):
        return "4X2"
    return None


def entero_o_nulo(valor):
    if isinstance(valor, (int, float)) and valor > 0:
        return int(valor)
    return None


def leer_tabla(ruta: Path):
    hoja = openpyxl.load_workbook(ruta, read_only=True, data_only=True).worksheets[0]
    filas = list(hoja.iter_rows(values_only=True))
    titulo = next((limpiar(c) for fila in filas[:FILAS_A_BUSCAR_ENCABEZADO] for c in fila if "TABLA" in limpiar(c).upper()), "")
    numero_tabla = int(PATRON_TABLA.search(titulo.upper()).group(1)) if PATRON_TABLA.search(titulo.upper()) else None
    anio_fiscal = int(PATRON_ANIO_FISCAL.search(titulo.upper()).group(1)) if PATRON_ANIO_FISCAL.search(titulo.upper()) else None
    indice_encabezado = buscar_encabezado(filas)
    columnas = ubicar_columnas(filas[indice_encabezado])
    anios = ubicar_anios(filas[indice_encabezado + 1])
    indice_capacidad = columnas.get("capacidad")
    for fila in filas[indice_encabezado + 2:]:
        if not limpiar(fila[columnas["marca"]]) or not limpiar(fila[columnas["linea"]]):
            continue
        yield {
            "archivo": ruta.name,
            "numero_tabla": numero_tabla,
            "anio_fiscal": anio_fiscal,
            "fila": fila,
            "columnas": columnas,
            "anios": anios,
            "tonelaje": fila[indice_capacidad] if indice_capacidad is not None else None,
            "pasajeros": fila[indice_capacidad + 1] if indice_capacidad is not None else None,
        }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("excel", nargs="+", type=Path)
    parser.add_argument("--salida", required=True, type=Path)
    args = parser.parse_args()

    marcas, lineas = {}, {}
    duplicadas, duplicadas_con_avaluo_distinto = 0, []
    filas_leidas = Counter()

    for ruta in args.excel:
        for registro in leer_tabla(ruta):
            filas_leidas[ruta.name] += 1
            fila, columnas = registro["fila"], registro["columnas"]
            marca, linea = limpiar(fila[columnas["marca"]]).upper(), limpiar(fila[columnas["linea"]])
            tipo_tabla = normalizar(fila[columnas["tipo"]]).upper() if "tipo" in columnas else ""
            clase = sin_tildes(limpiar(fila[columnas["clase"]])).upper() if "clase" in columnas else ""
            tipo_vehiculo = "MOTO" if "MOTO" in tipo_tabla else "CARRO"
            cilindrada_cc, potencia_kw = leer_cilindraje(fila[columnas["cilindraje"]])
            linea_mayus = sin_tildes(linea).upper()

            clave_marca = normalizar(marca)
            if clave_marca not in marcas:
                marcas[clave_marca] = {"id": len(marcas) + 1, "nombre": marca, "nombre_normalizado": clave_marca, "tipo": tipo_vehiculo}
            elif marcas[clave_marca]["tipo"] != tipo_vehiculo:
                marcas[clave_marca]["tipo"] = "AMBOS"
            marca_id = marcas[clave_marca]["id"]

            avaluos = {str(anio): int(fila[indice]) for indice, anio in registro["anios"].items()
                       if indice < len(fila) and isinstance(fila[indice], (int, float)) and fila[indice] > 0}
            clave_linea = (marca_id, normalizar(linea), cilindrada_cc, potencia_kw, clase)
            if clave_linea in lineas:
                duplicadas += 1
                if lineas[clave_linea]["avaluos_miles"] != json.dumps(avaluos):
                    duplicadas_con_avaluo_distinto.append(f"{marca} {linea} ({cilindrada_cc or potencia_kw}) en {registro['archivo']}")
                continue

            codigo = fila[columnas["codigo"]] if "codigo" in columnas else None
            lineas[clave_linea] = {
                "id": len(lineas) + 1,
                "marca_id": marca_id,
                "nombre": linea,
                "nombre_normalizado": normalizar(linea),
                "clase": clase,
                "tipo_vehiculo": tipo_vehiculo,
                "tabla_origen": registro["numero_tabla"],
                "cilindrada_cc": cilindrada_cc,
                "potencia_kw": potencia_kw,
                "combustible": inferir_combustible(linea_mayus, clase, registro["numero_tabla"], potencia_kw),
                "transmision": inferir_transmision(linea_mayus),
                "traccion": inferir_traccion(linea_mayus),
                "puertas": int(PATRON_PUERTAS.search(linea_mayus).group(1)) if PATRON_PUERTAS.search(linea_mayus) else None,
                "pasajeros": entero_o_nulo(registro["pasajeros"]),
                "tonelaje": entero_o_nulo(registro["tonelaje"]),
                "es_generica": any(marcador in linea_mayus for marcador in MARCADORES_LINEA_GENERICA),
                "codigo_mintransporte": int(codigo) if isinstance(codigo, (int, float)) else None,
                "anio_fiscal": registro["anio_fiscal"],
                "avaluos_miles": json.dumps(avaluos),
            }

    args.salida.mkdir(parents=True, exist_ok=True)
    escribir_csv(args.salida / "marca.csv", list(marcas.values()))
    escribir_csv(args.salida / "linea.csv", list(lineas.values()))

    nombres = sorted(marcas)
    sospechosas = sorted({tuple(sorted((a, b))) for a in nombres for b in difflib.get_close_matches(a, nombres, n=3, cutoff=SIMILITUD_MARCA_SOSPECHOSA) if a != b})
    genericas = sum(1 for linea in lineas.values() if linea["es_generica"])
    resumen = {
        "filas_leidas": dict(filas_leidas),
        "marcas": len(marcas),
        "lineas": len(lineas),
        "lineas_genericas": genericas,
        "duplicadas_descartadas": duplicadas,
        "duplicadas_con_avaluo_distinto": duplicadas_con_avaluo_distinto,
        "marcas_parecidas_para_revisar": [" / ".join(par) for par in sospechosas],
        "lineas_por_tipo": dict(Counter(linea["tipo_vehiculo"] for linea in lineas.values())),
        "combustible_inferido": dict(Counter(linea["combustible"] or "SIN_DATO" for linea in lineas.values())),
        "transmision_inferida": dict(Counter(linea["transmision"] or "SIN_DATO" for linea in lineas.values())),
    }
    (args.salida / "resumen.json").write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(resumen, ensure_ascii=False, indent=2))

    columnas_linea = ",".join(next(iter(lineas.values())).keys())
    print("\nCarga en Supabase (en orden, después de la migración del esquema catalogo):")
    print(f"  psql \"$WEVEH_DB_URL\" -c \"\\copy catalogo.marca(id,nombre,nombre_normalizado,tipo) from '{args.salida}/marca.csv' csv header\"")
    print(f"  psql \"$WEVEH_DB_URL\" -c \"\\copy catalogo.linea({columnas_linea}) from '{args.salida}/linea.csv' csv header\"")
    print("  psql \"$WEVEH_DB_URL\" -c \"select setval('catalogo.marca_id_seq', (select max(id) from catalogo.marca)); "
          "select setval('catalogo.linea_id_seq', (select max(id) from catalogo.linea));\"")


def escribir_csv(ruta: Path, filas: list) -> None:
    with ruta.open("w", newline="", encoding="utf-8") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=list(filas[0].keys()))
        escritor.writeheader()
        escritor.writerows(filas)


if __name__ == "__main__":
    main()
