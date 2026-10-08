#!/usr/bin/env python3
"""Normaliza el Excel de vehículos de Colombia y genera CSVs para catalogo.marca, catalogo.linea y catalogo.version.

Uso:
  python3 importar_catalogo.py --excel archivo.xlsx --hoja Hoja1 --mapeo mapeo.json --salida salida_catalogo/

Requiere: pandas, openpyxl.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd

CAMPOS_OBLIGATORIOS = ("marca", "linea", "anio_modelo", "version")
CAMPOS_OPCIONALES = ("cilindrada", "combustible", "tipo", "transmision", "traccion", "carroceria")
ANIO_MINIMO = 1950
ANIO_MAXIMO = 2030
PALABRAS_MOTO = ("moto", "motocicleta", "cuatrimoto", "motocarro")


def normalizar(texto) -> str:
    if texto is None or (isinstance(texto, float) and pd.isna(texto)):
        return ""
    sin_tildes = unicodedata.normalize("NFKD", str(texto)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", sin_tildes).strip().lower()


def limpiar_nombre(texto) -> str:
    if texto is None or (isinstance(texto, float) and pd.isna(texto)):
        return ""
    return re.sub(r"\s+", " ", str(texto)).strip()


def a_entero(valor):
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return None
    coincidencia = re.search(r"\d+([.,]\d+)?", str(valor))
    if not coincidencia:
        return None
    numero = float(coincidencia.group(0).replace(",", "."))
    return int(round(numero))


def a_cilindrada_cc(valor):
    """Acepta '3400', '3.400 cc' o '3.4' (litros) y devuelve centímetros cúbicos."""
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return None
    coincidencia = re.search(r"\d+([.,]\d+)?", str(valor))
    if not coincidencia:
        return None
    texto_numero = coincidencia.group(0)
    if re.fullmatch(r"\d{1,2}[.,]\d{3}", texto_numero):   # separador de miles: 3.400
        return int(texto_numero.replace(".", "").replace(",", ""))
    numero = float(texto_numero.replace(",", "."))
    return int(round(numero * 1000)) if numero < 10 else int(round(numero))


def clasificar_tipo(valor) -> str:
    texto = normalizar(valor)
    if not texto:
        return "CARRO"
    return "MOTO" if any(palabra in texto for palabra in PALABRAS_MOTO) else "CARRO"


def leer_mapeo(ruta: Path) -> dict:
    mapeo = json.loads(ruta.read_text(encoding="utf-8"))
    faltantes = [campo for campo in CAMPOS_OBLIGATORIOS if not mapeo.get(campo)]
    if faltantes:
        sys.exit(f"El mapeo no define columnas obligatorias: {faltantes}")
    return mapeo


def valor(fila, mapeo, campo):
    columna = mapeo.get(campo)
    if not columna:
        return None
    return fila.get(columna)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--excel", required=True, type=Path)
    parser.add_argument("--hoja", default=0)
    parser.add_argument("--mapeo", required=True, type=Path)
    parser.add_argument("--salida", required=True, type=Path)
    args = parser.parse_args()

    mapeo = leer_mapeo(args.mapeo)
    datos = pd.read_excel(args.excel, sheet_name=args.hoja, dtype=object)
    columnas_faltantes = [c for c in mapeo.values() if c and c not in datos.columns]
    if columnas_faltantes:
        sys.exit(f"Columnas del mapeo que no existen en el Excel: {columnas_faltantes}\nColumnas reales: {list(datos.columns)}")

    marcas, lineas, versiones = {}, {}, {}
    descartes = {"sin_marca_linea_version": 0, "anio_invalido": 0, "duplicada": 0}

    for _, fila in datos.iterrows():
        marca = limpiar_nombre(valor(fila, mapeo, "marca"))
        linea = limpiar_nombre(valor(fila, mapeo, "linea"))
        version = limpiar_nombre(valor(fila, mapeo, "version"))
        if not (marca and linea and version):
            descartes["sin_marca_linea_version"] += 1
            continue
        anio = a_entero(valor(fila, mapeo, "anio_modelo"))
        if anio is None or not ANIO_MINIMO <= anio <= ANIO_MAXIMO:
            descartes["anio_invalido"] += 1
            continue

        tipo = clasificar_tipo(valor(fila, mapeo, "tipo"))
        clave_marca = normalizar(marca)
        if clave_marca not in marcas:
            marcas[clave_marca] = {"id": len(marcas) + 1, "nombre": marca, "nombre_normalizado": clave_marca, "tipo": tipo}
        elif marcas[clave_marca]["tipo"] != tipo:
            marcas[clave_marca]["tipo"] = "AMBOS"
        marca_id = marcas[clave_marca]["id"]

        clave_linea = (marca_id, normalizar(linea))
        if clave_linea not in lineas:
            lineas[clave_linea] = {"id": len(lineas) + 1, "marca_id": marca_id, "nombre": linea, "nombre_normalizado": clave_linea[1]}
        linea_id = lineas[clave_linea]["id"]

        clave_version = (linea_id, anio, normalizar(version))
        if clave_version in versiones:
            descartes["duplicada"] += 1
            continue
        originales = {str(k): (None if pd.isna(v) else str(v)) for k, v in fila.items()}
        versiones[clave_version] = {
            "id": len(versiones) + 1,
            "linea_id": linea_id,
            "anio_modelo": anio,
            "nombre": version,
            "cilindrada_cc": a_cilindrada_cc(valor(fila, mapeo, "cilindrada")),
            "combustible": limpiar_nombre(valor(fila, mapeo, "combustible")) or None,
            "transmision": limpiar_nombre(valor(fila, mapeo, "transmision")) or None,
            "traccion": limpiar_nombre(valor(fila, mapeo, "traccion")) or None,
            "carroceria": limpiar_nombre(valor(fila, mapeo, "carroceria")) or None,
            "datos_originales": json.dumps(originales, ensure_ascii=False),
        }

    args.salida.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(marcas.values()).to_csv(args.salida / "marca.csv", index=False)
    pd.DataFrame(lineas.values()).to_csv(args.salida / "linea.csv", index=False)
    tabla_versiones = pd.DataFrame(versiones.values())
    tabla_versiones["cilindrada_cc"] = tabla_versiones["cilindrada_cc"].astype("Int64")
    tabla_versiones.to_csv(args.salida / "version.csv", index=False)

    print(f"Filas leídas: {len(datos)}")
    print(f"Marcas: {len(marcas)} · Líneas: {len(lineas)} · Versiones: {len(versiones)}")
    print(f"Descartes: {descartes}")
    print("\nCarga en Supabase (en orden):")
    print(f"  psql \"$WEVEH_DB_URL\" -c \"\\copy catalogo.marca(id,nombre,nombre_normalizado,tipo) from '{args.salida}/marca.csv' csv header\"")
    print(f"  psql \"$WEVEH_DB_URL\" -c \"\\copy catalogo.linea(id,marca_id,nombre,nombre_normalizado) from '{args.salida}/linea.csv' csv header\"")
    print(f"  psql \"$WEVEH_DB_URL\" -c \"\\copy catalogo.version(id,linea_id,anio_modelo,nombre,cilindrada_cc,combustible,transmision,traccion,carroceria,datos_originales) from '{args.salida}/version.csv' csv header\"")
    print("  psql \"$WEVEH_DB_URL\" -c \"select setval('catalogo.marca_id_seq', (select max(id) from catalogo.marca)); "
          "select setval('catalogo.linea_id_seq', (select max(id) from catalogo.linea)); "
          "select setval('catalogo.version_id_seq', (select max(id) from catalogo.version));\"")


if __name__ == "__main__":
    main()
