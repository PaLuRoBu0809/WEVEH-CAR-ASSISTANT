package co.weveh.garaje.infrastructure.web;

import static co.weveh.SesionDePrueba.como;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.garaje.application.Garaje;
import co.weveh.garaje.domain.RegistroInicial;
import co.weveh.garaje.domain.Transmision;
import co.weveh.garaje.domain.UsoVehiculo;
import co.weveh.garaje.domain.Vehiculo;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.UsuarioId;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.RecursoNoEncontradoException;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.infrastructure.web.ConfiguracionSeguridad;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * RF-GAR-01 a RF-GAR-04 y RF-CTA-04 (sin sesión, 401).
 */
@WebMvcTest(VehiculoController.class)
@Import(ConfiguracionSeguridad.class)
class VehiculoControllerTest {

    private static final String USUARIO = "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11";
    private static final UsuarioId ID_USUARIO = UsuarioId.desdeTexto(USUARIO);

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    Garaje garaje;

    static Vehiculo prado() {
        var registro = new RegistroInicial(188000, LocalDate.of(2026, 6, 5), LocalDate.of(2026, 6, 30),
                LocalDate.of(2026, 6, 28), false, null, null);
        return new Vehiculo(UUID.fromString("7a1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c22"), ID_USUARIO, TipoVehiculo.CARRO,
                7811L, "TOYOTA", "PRADO VX 5P AT", 3400, 2008, null, Transmision.AUTOMATICA, null, "La Prado", null,
                null, new Kilometraje(190000), UsoVehiculo.MIXTO, 1000, registro, 0);
    }

    @Test
    void garajeVacioDevuelveListaVacia() throws Exception {
        when(garaje.listar(ID_USUARIO)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/vehiculos").with(como(USUARIO)))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void devuelveLosVehiculosDelUsuario() throws Exception {
        when(garaje.listar(ID_USUARIO)).thenReturn(List.of(prado()));

        mockMvc.perform(get("/api/v1/vehiculos").with(como(USUARIO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alias").value("La Prado"))
                .andExpect(jsonPath("$[0].kilometraje").value(190000))
                .andExpect(jsonPath("$[0].transmision").value("AUTOMATICA"));
    }

    @Test
    void registrarRespondeCreadoConLocation() throws Exception {
        when(garaje.registrar(eq(ID_USUARIO), any())).thenReturn(prado());

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","catalogoLineaId":7811,"marca":"TOYOTA","linea":"PRADO VX 5P AT",
                                 "cilindradaCc":3400,"anioModelo":2008,"kilometraje":190000,"aceiteKm":188000,
                                 "aceiteFecha":"2026-06-05","soatFecha":"2026-06-30","rtmFecha":"2026-06-28"}"""))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/vehiculos/7a1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c22"))
                .andExpect(jsonPath("$.linea").value("PRADO VX 5P AT"));
    }

    @Test
    void unaReglaDeNegocioRotaRespondeProblemDetails400() throws Exception {
        when(garaje.registrar(eq(ID_USUARIO), any()))
                .thenThrow(new DatoInvalidoException("El kilometraje debe ser mayor o igual a cero"));

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tipo":"CARRO","marca":"TOYOTA","linea":"PRADO","anioModelo":2008,"kilometraje":-5,
                                 "soatFecha":"2026-06-30","rtmAunNoAplica":true}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/dato-invalido"))
                .andExpect(jsonPath("$.detail").value("El kilometraje debe ser mayor o igual a cero"));
    }

    @Test
    void sinCamposObligatoriosResponde400SinLlamarAlCasoDeUso() throws Exception {
        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"marca\":\"TOYOTA\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/dato-invalido"));

        verify(garaje, never()).registrar(any(), any());
    }

    @Test
    void vehiculoDeOtroUsuarioResponde404() throws Exception {
        var id = UUID.randomUUID();
        when(garaje.obtener(ID_USUARIO, id)).thenThrow(new RecursoNoEncontradoException("No encontramos ese vehículo en tu garaje"));

        mockMvc.perform(get("/api/v1/vehiculos/" + id).with(como(USUARIO)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/no-encontrado"));
    }

    @Test
    void eliminarResponde204() throws Exception {
        var id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/vehiculos/" + id).with(como(USUARIO)))
                .andExpect(status().isNoContent());

        verify(garaje).eliminar(ID_USUARIO, id);
    }

    @Test
    void eliminarUnoQueNoExisteResponde404() throws Exception {
        var id = UUID.randomUUID();
        doThrow(new RecursoNoEncontradoException("No encontramos ese vehículo en tu garaje")).when(garaje).eliminar(ID_USUARIO, id);

        mockMvc.perform(delete("/api/v1/vehiculos/" + id).with(como(USUARIO)))
                .andExpect(status().isNotFound());
    }

    @Test
    void sinSesionRespondeProblemDetails401() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/no-autenticado"));

        verify(garaje, never()).listar(any());
    }
}
