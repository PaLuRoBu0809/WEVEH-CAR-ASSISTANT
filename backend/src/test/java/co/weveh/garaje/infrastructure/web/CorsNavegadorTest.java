package co.weveh.garaje.infrastructure.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.garaje.application.ListarVehiculos;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Probar la app en el navegador del PC: el preflight no lleva X-Weveh-Dispositivo y no debe responder 400.
 */
@WebMvcTest(controllers = VehiculoController.class, properties = "weveh.cors.origenes=http://localhost:8081")
class CorsNavegadorTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ListarVehiculos listarVehiculos;

    @Test
    void elPreflightDelOrigenPermitidoPasa() throws Exception {
        mockMvc.perform(options("/api/v1/vehiculos")
                        .header("Origin", "http://localhost:8081")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "X-Weveh-Dispositivo"))
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
    void lasPeticionesSiguenExigiendoElDispositivo() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Origin", "http://localhost:8081"))
                .andExpect(status().isBadRequest());
    }
}
