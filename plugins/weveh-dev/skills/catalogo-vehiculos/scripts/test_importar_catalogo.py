"""Pruebas de la capa 0 (ADR 0021) con nombres reales de las tablas 2025 del Ministerio.

Correr: python -m unittest discover -s plugins/weveh-dev/skills/catalogo-vehiculos/scripts
"""
import unittest

from importar_catalogo import inferir_combustible, inferir_traccion, inferir_transmision

AUTOMOVIL, CAMIONETA, DOBLE_CABINA = "AUTOMOVIL", "CAMIONETAS Y CAMPEROS", "DOBLECABINA"


def atributos(linea, clase=AUTOMOVIL, tabla=1, marca="", potencia_kw=None):
    return (inferir_combustible(linea, clase, tabla, potencia_kw, marca), inferir_transmision(linea), inferir_traccion(linea))


class CombustibleTransmisionYTraccion(unittest.TestCase):
    def test_bmw_con_d_es_diesel_y_tp_es_automatica(self):
        self.assertEqual(atributos("120D E87 TP", marca="BMW"), ("DIESEL", "AUTOMATICA", None))

    def test_bmw_con_i_es_gasolina(self):
        self.assertEqual(atributos("116I F20 STANDARD 5P TP", marca="BMW"), ("GASOLINA", "AUTOMATICA", None))

    def test_d_de_la_generacion_del_audi_no_es_diesel(self):
        self.assertEqual(atributos("A8 D4 3.0 TFSI TIPTRONIC QUATTRO TP", marca="AUDI"), ("GASOLINA", "AUTOMATICA", "AWD"))

    def test_sin_pista_de_combustible_queda_sin_dato(self):
        self.assertEqual(atributos("CORSA GL 4P MT", marca="CHEVROLET"), (None, "MECANICA", None))

    def test_camioneta_4x4_automatica(self):
        self.assertEqual(atributos("MDX TOURING 4X4 AT", clase=CAMIONETA, tabla=2, marca="ACURA"), (None, "AUTOMATICA", "4X4"))

    def test_motocarro_re205_d_es_diesel(self):
        combustible = inferir_combustible("CAMELLITO RE205 D BASICO MT", "MOTOCARRO", 5, None, "AUTECO")
        self.assertEqual(combustible, "DIESEL")

    def test_motocicleta_no_electrica_es_gasolina(self):
        self.assertEqual(inferir_combustible("PULSAR NS 200 MT", "MOTOCICLETA", 5, None, "BAJAJ"), "GASOLINA")

    def test_d_de_la_caja_dct_en_moto_no_es_diesel(self):
        self.assertEqual(inferir_combustible("NC 750X D TP", "MOTOCICLETA", 5, None, "HONDA"), "GASOLINA")

    def test_motocarro_sin_pista_queda_sin_dato(self):
        self.assertIsNone(inferir_combustible("TORITO 4T BASICO MT", "MOTOCARRO", 5, None, "AUTECO"))

    def test_moto_electrica_por_potencia(self):
        self.assertEqual(inferir_combustible("MAK3", "CICLOMOTOR", 5, 1.2, "AIMA"), "ELECTRICO")

    def test_d_de_doble_cabina_no_es_diesel(self):
        self.assertEqual(inferir_combustible("HILUX D.C 4X4 AT", DOBLE_CABINA, 3, None, "TOYOTA"), None)

    def test_letra_de_otra_marca_no_es_combustible(self):
        self.assertIsNone(inferir_combustible("ACTYON G23D MT", CAMIONETA, 2, None, "SSANGYONG - KGM"))

    def test_mercedes_con_d_suelta_es_diesel(self):
        self.assertEqual(inferir_combustible("200 D MT", AUTOMOVIL, 1, None, "MERCEDES BENZ"), "DIESEL")

    def test_bmw_con_e_es_hibrido_enchufable_y_xdrive_es_awd(self):
        self.assertEqual(atributos("X5 XDRIVE40E", clase=CAMIONETA, tabla=2, marca="BMW"), ("HIBRIDO_ENCHUFABLE", None, "AWD"))

    def test_sdrive_es_4x2(self):
        self.assertEqual(atributos("X1 SDRIVE 18D TP", clase=CAMIONETA, tabla=2, marca="BMW"), ("DIESEL", "AUTOMATICA", "4X2"))

    def test_tabla_9_es_hibrido_y_e_tron_enchufable(self):
        self.assertEqual(inferir_combustible("CAMRY HYBRID XLE TP", AUTOMOVIL, 9, None, "TOYOTA"), "HIBRIDO")
        self.assertEqual(inferir_combustible("A3 SPORTBACK E-TRON", AUTOMOVIL, 9, None, "AUDI"), "HIBRIDO_ENCHUFABLE")

    def test_cdi_y_dsl_son_diesel(self):
        self.assertEqual(inferir_combustible("C 220 CDI TP", AUTOMOVIL, 1, None, "MERCEDES BENZ"), "DIESEL")
        self.assertEqual(inferir_combustible("WINGLE 5 DSL 2.0 4WD DC", DOBLE_CABINA, 3, None, "GREAT WALL MOTOR"), "DIESEL")

    def test_linea_con_dos_tracciones_queda_sin_dato(self):
        self.assertIsNone(inferir_traccion("D22, FRONTIER Y/O NP300 2.5L LOOK 4X4 4X2 MT"))

    def test_con_dos_marcas_de_caja_gana_la_ultima(self):
        self.assertEqual(inferir_transmision("MT 150T AT"), "AUTOMATICA")

    def test_cajas_con_nombre_propio_son_automaticas(self):
        for nombre in ("SPIDER 2.2 JTS SELESPEED TP", "NEW QASHQAI SENSE 2.0 2WD M-CVT", "TT 8J 3.2 FSI COUPE S-TRONIC TP"):
            self.assertEqual(inferir_transmision(nombre), "AUTOMATICA", nombre)


if __name__ == "__main__":
    unittest.main()
