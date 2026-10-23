package co.weveh;

import static co.weveh.SesionDePrueba.como;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * RF-GAR-06, RNF-05 y ADR 0009 con Postgres real: un cambio hecho sin red se guarda una sola vez aunque llegue dos
 * veces, y una lectura vieja que llega tarde no pisa una más nueva.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CambiosSinRedIntegracionTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcClient jdbc;

    @MockitoBean
    ProveedorIdentidad identidad;

    @Test
    void elMismoCambioDosVecesSeGuardaUnaVezYRespondeIgual() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);
        var clave = UUID.randomUUID().toString();

        var primera = kilometraje(laura, vehiculo, clave, 190800, null)
                .andExpect(status().isOk())
                .andExpect(header().doesNotExist("Idempotent-Replayed"))
                .andReturn().getResponse().getContentAsString();
        var segunda = kilometraje(laura, vehiculo, clave, 190800, null)
                .andExpect(status().isOk())
                .andExpect(header().string("Idempotent-Replayed", "true"))
                .andReturn().getResponse().getContentAsString();

        assertThat(segunda).isEqualTo(primera);
        assertThat(cambiosGuardados(laura)).isEqualTo(1);
    }

    @Test
    void laMismaClaveEnOtroCambioSeRechaza() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);
        var clave = UUID.randomUUID().toString();
        kilometraje(laura, vehiculo, clave, 190800, null).andExpect(status().isOk());

        mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo).with(como(laura))
                        .header("Idempotency-Key", clave)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"uso\":\"MIXTO\",\"kmPromedioMes\":1000,\"versionFila\":0}"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/clave-repetida"));
    }

    @Test
    void unErrorNoSeGuardaYSePuedeReintentar() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);
        var clave = UUID.randomUUID().toString();

        kilometraje(laura, vehiculo, clave, 150000, null).andExpect(status().isBadRequest());

        assertThat(cambiosGuardados(laura)).isZero();
    }

    @Test
    void unaLecturaViejaQueLlegaTardeNoPisaLaMasNueva() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);
        kilometraje(laura, vehiculo, UUID.randomUUID().toString(), 191000, null).andExpect(status().isOk());

        kilometraje(laura, vehiculo, UUID.randomUUID().toString(), 190500, LocalDate.now().minusDays(2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kilometraje").value(191000));

        mockMvc.perform(get("/api/v1/vehiculos/" + vehiculo).with(como(laura)))
                .andExpect(jsonPath("$.kilometraje").value(191000));
    }

    /** ADR 0023: "Me equivoqué al anotarlo". */
    @Test
    void laUltimaLecturaSeCorrigeHastaLaAnteriorYQuedaEnElHistorial() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);
        kilometraje(laura, vehiculo, UUID.randomUUID().toString(), 191000, null).andExpect(status().isOk());

        corregir(laura, vehiculo, 189999)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No puede quedar por debajo de la lectura anterior: 190.000 km"));
        corregir(laura, vehiculo, 190100)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kilometraje").value(190100));

        assertThat(jdbc.sql("""
                        select km from lectura_kilometraje where vehiculo_id = ?::uuid and corregida""")
                .param(vehiculo).query(Integer.class).single()).isEqualTo(190100);
    }

    @Test
    void laPrimeraLecturaSePuedeCorregirYNoSirveParaSubir() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);

        corregir(laura, vehiculo, 195000).andExpect(status().isBadRequest());
        corregir(laura, vehiculo, 19000).andExpect(status().isOk()).andExpect(jsonPath("$.kilometraje").value(19000));
    }

    @Test
    void sinClaveFuncionaComoSiempre() throws Exception {
        var laura = UUID.randomUUID().toString();
        var vehiculo = crearCuentaConVehiculo(laura);

        mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo + "/kilometraje").with(como(laura))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kilometraje\":190700}"))
                .andExpect(status().isOk());

        assertThat(cambiosGuardados(laura)).isZero();
    }

    private ResultActions kilometraje(String usuario, String vehiculo, String clave, int km, LocalDate leidoEn)
            throws Exception {
        var fecha = leidoEn == null ? "" : ",\"leidoEn\":\"" + leidoEn + "\"";
        return mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo + "/kilometraje").with(como(usuario))
                .header("Idempotency-Key", clave)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"kilometraje\":" + km + fecha + "}"));
    }

    private ResultActions corregir(String usuario, String vehiculo, int km) throws Exception {
        return mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo + "/kilometraje/correccion").with(como(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"kilometraje\":" + km + "}"));
    }

    private String crearCuentaConVehiculo(String usuario) throws Exception {
        mockMvc.perform(post("/api/v1/cuenta").with(como(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\"}"))
                .andExpect(status().isCreated());
        var respuesta = mockMvc.perform(post("/api/v1/vehiculos").with(como(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","marca":"TOYOTA","linea":"PRADO VX 5P AT","anioModelo":2008,
                                 "kilometraje":190000,"soatFecha":"2026-06-30","rtmFecha":"2026-06-28"}"""))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.id");
    }

    private int cambiosGuardados(String usuario) {
        return jdbc.sql("select count(*) from cambio_procesado where usuario_id = ?::uuid")
                .param(usuario)
                .query(Integer.class)
                .single();
    }
}
