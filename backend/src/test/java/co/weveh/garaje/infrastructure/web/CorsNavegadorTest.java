package co.weveh.garaje.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.garaje.application.Garaje;
import co.weveh.shared.infrastructure.web.ConfiguracionSeguridad;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Probar la app en el navegador del PC: el preflight no lleva token y no debe responder 401; las peticiones reales sí lo
 * exigen.
 */
@WebMvcTest(controllers = VehiculoController.class, properties = "weveh.cors.origenes=http://localhost:8081")
@Import(ConfiguracionSeguridad.class)
class CorsNavegadorTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    Garaje garaje;

    @Test
    void elPreflightDelOrigenPermitidoPasa() throws Exception {
        mockMvc.perform(options("/api/v1/vehiculos")
                        .header("Origin", "http://localhost:8081")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:8081"));
    }

    @Test
    void unOrigenNoPermitidoSeRechaza() throws Exception {
        mockMvc.perform(options("/api/v1/vehiculos")
                        .header("Origin", "https://otro-sitio.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void lasPeticionesSiguenExigiendoLaSesion() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Origin", "http://localhost:8081"))
                .andExpect(status().isUnauthorized());
    }
}
