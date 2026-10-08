package co.weveh;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Fase 1 de punta a punta con Postgres real: catálogo (RF-CAT-01/02) y garaje (RF-GAR-02/04).
 * Criterio de cierre de la skill arranque: registrar la Prado eligiendo Toyota → "PRADO VX 5P AT · 3.400 cc" → 2008.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RegistroVehiculoIntegracionTest {

    static final String MIO = "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11";
    static final String OTRO = "9b2d5e7a-1c3f-4a8b-b6d2-0e4f7a9c1b35";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcClient jdbc;

    @BeforeEach
    void catalogoDePrueba() {
        jdbc.sql("delete from vehiculo").update();
        jdbc.sql("delete from catalogo.linea").update();
        jdbc.sql("delete from catalogo.marca").update();
        jdbc.sql("insert into catalogo.marca (id, nombre, nombre_normalizado, tipo) values (145, 'TOYOTA', 'toyota', 'AMBOS'), (200, 'CITROËN', 'citroen', 'CARRO')").update();
        jdbc.sql("""
                insert into catalogo.linea (id, marca_id, nombre, nombre_normalizado, clase, tipo_vehiculo, cilindrada_cc, transmision, es_generica)
                values (7811, 145, 'PRADO VX 5P AT', 'prado vx 5p at', 'CAMIONETAS Y CAMPEROS', 'CARRO', 3400, 'AUTOMATICA', false),
                       (7812, 145, 'PRADO VX 5P AT', 'prado vx 5p at', 'CAMIONETAS Y CAMPEROS', 'CARRO', 3956, 'AUTOMATICA', false),
                       (7900, 145, 'COROLLA XEI', 'corolla xei', 'AUTOMOVIL', 'CARRO', 1800, null, false),
                       (7999, 145, 'SIN LINEA', 'sin linea', 'AUTOMOVIL', 'CARRO', null, null, true)""").update();
    }

    @Test
    void buscaMarcasSinTildesNiMayusculas() throws Exception {
        mockMvc.perform(get("/api/v1/catalogo/marcas").param("tipo", "CARRO").param("q", "CITROEN").header("X-Weveh-Dispositivo", MIO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nombre").value("CITROËN"));
    }

    @Test
    void buscaLineasPorPalabrasSinGenericasOrdenadasPorCilindrada() throws Exception {
        mockMvc.perform(get("/api/v1/catalogo/marcas/145/lineas").param("q", "prado vx").header("X-Weveh-Dispositivo", MIO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].cilindradaCc").value(3400))
                .andExpect(jsonPath("$[0].transmision").value("AUTOMATICA"));

        mockMvc.perform(get("/api/v1/catalogo/marcas/145/lineas").header("X-Weveh-Dispositivo", MIO))
                .andExpect(jsonPath("$[?(@.nombre == 'SIN LINEA')]").isEmpty());
    }

    @Test
    void registraLaPradoYSoloLaVeSuDispositivo() throws Exception {
        var respuesta = mockMvc.perform(post("/api/v1/vehiculos")
                        .header("X-Weveh-Dispositivo", MIO)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","catalogoLineaId":7811,"marca":"TOYOTA","linea":"PRADO VX 5P AT",
                                 "cilindradaCc":3400,"anioModelo":2008,"transmision":"AUTOMATICA","traccion":"4X4",
                                 "kilometraje":190000,"aceiteKm":188000,"aceiteFecha":"2026-06-05",
                                 "soatFecha":"2026-06-30","rtmFecha":"2026-06-28","alias":"La Prado","placa":"abc 123"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.placa").value("ABC123"))
                .andExpect(jsonPath("$.traccion").value("4X4"))
                .andReturn().getResponse();
        var ubicacion = respuesta.getHeader("Location");
        assertThat(ubicacion).startsWith("/api/v1/vehiculos/");

        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", MIO))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].alias").value("La Prado"))
                .andExpect(jsonPath("$[0].kilometraje").value(190000));
        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", OTRO))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get(ubicacion).header("X-Weveh-Dispositivo", OTRO))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete(ubicacion).header("X-Weveh-Dispositivo", OTRO))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete(ubicacion).header("X-Weveh-Dispositivo", MIO))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", MIO))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void vehiculoQueNoEstaEnElCatalogoSeRegistraConTextoLibre() throws Exception {
        mockMvc.perform(post("/api/v1/vehiculos")
                        .header("X-Weveh-Dispositivo", MIO)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"MOTO","marca":"Marca rara","linea":"Modelo X","anioModelo":2020,
                                 "kilometraje":12000,"soatFecha":"2026-01-10","rtmFecha":"2026-02-01"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.catalogoLineaId").isEmpty());
    }

    @Test
    void kilometrajeNegativoMuestraElMensajeDelRequisito() throws Exception {
        mockMvc.perform(post("/api/v1/vehiculos")
                        .header("X-Weveh-Dispositivo", MIO)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","marca":"TOYOTA","linea":"COROLLA XEI","anioModelo":2015,
                                 "kilometraje":-10,"soatFecha":"2026-01-10","rtmAunNoAplica":true}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("El kilometraje debe ser mayor o igual a cero"));
    }
}
