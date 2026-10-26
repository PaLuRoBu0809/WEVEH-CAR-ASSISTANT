package co.weveh.garaje.infrastructure.web;

import static co.weveh.SesionDePrueba.como;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.garaje.application.Garaje;
import co.weveh.shared.infrastructure.web.ConfiguracionSeguridad;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** ADR 0010: con WEVEH_MODULO_GARAJE=inactivo el garaje responde 503 y no toca el caso de uso. */
@WebMvcTest(VehiculoController.class)
@Import(ConfiguracionSeguridad.class)
@TestPropertySource(properties = "weveh.modulo.garaje=inactivo")
class GarajeApagadoTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    Garaje garaje;

    @Test
    void respondeEnMantenimiento() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").with(como("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11")))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/modulo-inactivo"))
                .andExpect(jsonPath("$.title").value("En mantenimiento"));

        verify(garaje, never()).listar(any());
    }
}
