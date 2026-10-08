package co.weveh.garaje.infrastructure.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.garaje.application.ListarVehiculos;
import co.weveh.garaje.application.VehiculoResumen;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RF-GAR-00 y RF-GAR-01.
 */
@WebMvcTest(VehiculoController.class)
class VehiculoControllerTest {

    private static final String DISPOSITIVO = "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11";

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ListarVehiculos listarVehiculos;

    @Test
    void garajeVacioDevuelveListaVacia() throws Exception {
        when(listarVehiculos.ejecutar(DispositivoId.desdeTexto(DISPOSITIVO))).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", DISPOSITIVO))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void devuelveLosVehiculosDelDispositivo() throws Exception {
        var prado = new VehiculoResumen(UUID.randomUUID(), "CARRO", "La Prado", "TOYOTA", "PRADO VX 5P AT", 2008, 190000);
        when(listarVehiculos.ejecutar(DispositivoId.desdeTexto(DISPOSITIVO))).thenReturn(List.of(prado));

        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", DISPOSITIVO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alias").value("La Prado"))
                .andExpect(jsonPath("$[0].kilometraje").value(190000));
    }

    @Test
    void sinHeaderRespondeProblemDetails400() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/dispositivo-invalido"))
                .andExpect(jsonPath("$.title").value("Dispositivo no válido"))
                .andExpect(jsonPath("$.status").value(400));

        verify(listarVehiculos, never()).ejecutar(any());
    }

    @Test
    void headerQueNoEsUuidV4Responde400() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/dispositivo-invalido"));
    }
}
