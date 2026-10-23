package co.weveh;

import static co.weveh.SesionDePrueba.como;
import static co.weveh.SesionDePrueba.comoDesde;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Duration;
import java.time.Instant;
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
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Cuenta de punta a punta con Postgres real (RF-CTA, RF-DAT). Supabase Auth se reemplaza por un doble.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class CuentaIntegracionTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcClient jdbc;

    @MockitoBean
    ProveedorIdentidad identidad;

    @Test
    void creaLeeYEditaLaCuentaConSuConsentimiento() throws Exception {
        var laura = UUID.randomUUID().toString();

        mockMvc.perform(post("/api/v1/cuenta").with(como(laura))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nombre":"Laura","versionPolitica":"0.1-borrador","aceptadoEn":"2026-10-15T14:58:00Z"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Laura"))
                .andExpect(jsonPath("$.correo").value(SesionDePrueba.CORREO))
                .andExpect(jsonPath("$.consentimientos[0].versionPolitica").value("0.1-borrador"))
                .andExpect(jsonPath("$.consentimientos[0].medio").value("APP_REGISTRO"));

        mockMvc.perform(put("/api/v1/cuenta").with(como(laura))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"Laura Gómez\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Laura Gómez"));

        mockMvc.perform(post("/api/v1/cuenta/consentimientos").with(como(laura))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versionPolitica\":\"1.0\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consentimientos.length()").value(2));

        mockMvc.perform(get("/api/v1/cuenta").with(como(laura)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Laura Gómez"));
    }

    @Test
    void quienEntraConGoogleQuedaConMedioAppGoogle() throws Exception {
        var laura = UUID.randomUUID().toString();

        mockMvc.perform(post("/api/v1/cuenta").with(como(laura))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\",\"medio\":\"APP_GOOGLE\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/cuenta").with(como(laura)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consentimientos[0].medio").value("APP_GOOGLE"));
    }

    @Test
    void sinPerfilLaCuentaResponde404() throws Exception {
        mockMvc.perform(get("/api/v1/cuenta").with(como(UUID.randomUUID().toString())))
                .andExpect(status().isNotFound());
    }

    @Test
    void eliminarLaCuentaBorraTodoLoSuyoSoloConSesionReciente() throws Exception {
        var laura = UUID.randomUUID().toString();
        crearCuentaConVehiculo(laura);

        mockMvc.perform(delete("/api/v1/cuenta").with(comoDesde(laura, Instant.now().minus(Duration.ofHours(1)))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/identidad-no-confirmada"));
        verify(identidad, never()).eliminarUsuario(any());
        assertThat(filas("vehiculo", laura)).isEqualTo(1);

        mockMvc.perform(delete("/api/v1/cuenta").with(como(laura)))
                .andExpect(status().isNoContent());

        verify(identidad).eliminarUsuario(UsuarioId.desdeTexto(laura));
        assertThat(filas("usuario", laura) + filas("vehiculo", laura) + filas("consentimiento", laura)).isZero();
        mockMvc.perform(get("/api/v1/cuenta").with(como(laura))).andExpect(status().isNotFound());
    }

    @Test
    void siSupabaseFallaLaCuentaQuedaIntacta() throws Exception {
        var laura = UUID.randomUUID().toString();
        crearCuentaConVehiculo(laura);
        doThrow(new ServicioNoDisponibleException("Eliminar la cuenta no está disponible por ahora"))
                .when(identidad).eliminarUsuario(any());

        mockMvc.perform(delete("/api/v1/cuenta").with(como(laura)))
                .andExpect(status().isServiceUnavailable());

        assertThat(filas("usuario", laura)).isEqualTo(1);
        assertThat(filas("vehiculo", laura)).isEqualTo(1);
        reset(identidad);
    }

    private void crearCuentaConVehiculo(String usuario) throws Exception {
        mockMvc.perform(post("/api/v1/cuenta").with(como(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\"}"))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/vehiculos").with(como(usuario))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","marca":"TOYOTA","linea":"PRADO VX 5P AT","anioModelo":2008,
                                 "kilometraje":190000,"soatFecha":"2026-06-30","rtmFecha":"2026-06-28"}"""))
                .andExpect(status().isCreated());
    }

    private int filas(String tabla, String usuario) {
        var columna = "usuario".equals(tabla) ? "id" : "usuario_id";
        return jdbc.sql("select count(*) from " + tabla + " where " + columna + " = ?::uuid")
                .param(usuario)
                .query(Integer.class)
                .single();
    }
}
