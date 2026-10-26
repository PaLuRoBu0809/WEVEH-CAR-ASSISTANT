package co.weveh;

import static co.weveh.SesionDePrueba.como;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import co.weveh.mecanicoia.application.ConversarConMecanico;
import co.weveh.mecanicoia.application.TranscribirAudio;
import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.domain.CausaCritica;
import co.weveh.mecanicoia.domain.RolMensaje;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import co.weveh.shared.domain.LimiteDiarioException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Contrato HTTP del Mecánico IA (RF-MIA-02, RF-MIA-07, RF-MIA-11): rutas, forma de la tarjeta con el plazo, el 429 del
 * tope diario y la salud de Groq. Los casos de uso van con dobles; su lógica se prueba aparte.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class MecanicoIaWebTest {

    static final String LAURA = "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11";
    static final UsuarioId USUARIO = UsuarioId.desdeTexto(LAURA);
    static final UUID VEHICULO = UUID.randomUUID();
    static final UUID CONVERSACION = UUID.randomUUID();
    static final String RUTA = "/api/v1/vehiculos/" + VEHICULO + "/conversaciones";

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProveedorIdentidad identidad;

    @MockitoBean
    ConversarConMecanico conversar;

    @MockitoBean
    TranscribirAudio transcribir;

    @Test
    void creaListaYMuestraUnaConversacionConSuTarjeta() throws Exception {
        var ahora = Instant.parse("2026-10-26T15:00:00Z");
        var tarjeta = ValidadorSeguridadDiagnostico.tarjetaPorSenal(CausaCritica.FRENOS, false);
        when(conversar.crear(USUARIO, VEHICULO)).thenReturn(new ConversarConMecanico.Creada(CONVERSACION, ahora));
        when(conversar.listar(USUARIO, VEHICULO))
                .thenReturn(List.of(new ConversacionRepositorio.Resumen(CONVERSACION, ahora, "no frena bien")));
        when(conversar.ver(USUARIO, VEHICULO, CONVERSACION)).thenReturn(List.of(
                new ConversacionRepositorio.Mensaje(UUID.randomUUID(), RolMensaje.PERSONA, "no frena bien", null, ahora),
                new ConversacionRepositorio.Mensaje(UUID.randomUUID(), RolMensaje.MECANICO, "Podrían ser las pastillas.",
                        tarjeta, ahora)));

        mockMvc.perform(post(RUTA).with(como(LAURA)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(CONVERSACION.toString()));
        mockMvc.perform(get(RUTA).with(como(LAURA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].primerMensaje").value("no frena bien"));
        mockMvc.perform(get(RUTA + "/" + CONVERSACION).with(como(LAURA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensajes[0].rol").value("PERSONA"))
                .andExpect(jsonPath("$.mensajes[0].tarjeta").doesNotExist())
                .andExpect(jsonPath("$.mensajes[1].tarjeta.plazo").value("NO_MANEJAR"))
                .andExpect(jsonPath("$.mensajes[1].tarjeta.textoPlazo").value("No manejes; llévalo hoy al mecánico"))
                .andExpect(jsonPath("$.mensajes[1].tarjeta.gravedad").value("Crítico"));
    }

    @Test
    void enviarDevuelveLaRespuestaYLaTarjetaSoloConSintoma() throws Exception {
        var tarjeta = ValidadorSeguridadDiagnostico.tarjetaPorSenal(CausaCritica.BATERIA, false);
        when(conversar.enviar(USUARIO, VEHICULO, CONVERSACION, "la batería se descarga"))
                .thenReturn(new ConversarConMecanico.Respuesta("Podría ser el alternador.", tarjeta));
        when(conversar.enviar(USUARIO, VEHICULO, CONVERSACION, "¿cada cuánto cambio el aceite?"))
                .thenReturn(new ConversarConMecanico.Respuesta("Suele ser cada 5.000 a 10.000 km.", null));

        mockMvc.perform(post(RUTA + "/" + CONVERSACION + "/mensajes").with(como(LAURA))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"texto\":\"la batería se descarga\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.respuesta").value("Podría ser el alternador."))
                .andExpect(jsonPath("$.tarjeta.plazo").value("HOY"))
                .andExpect(jsonPath("$.tarjeta.aviso").value("Orientación, no reemplaza al mecánico"));
        mockMvc.perform(post(RUTA + "/" + CONVERSACION + "/mensajes").with(como(LAURA))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"texto\":\"¿cada cuánto cambio el aceite?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tarjeta").doesNotExist());
    }

    @Test
    void elTopeDiarioResponde429ConSuTexto() throws Exception {
        when(conversar.enviar(eq(USUARIO), eq(VEHICULO), eq(CONVERSACION), any())).thenThrow(new LimiteDiarioException());

        mockMvc.perform(post(RUTA + "/" + CONVERSACION + "/mensajes").with(como(LAURA))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"texto\":\"hace un ruido raro\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/limite-diario"))
                .andExpect(jsonPath("$.detail").value("Por hoy llegaste al máximo de mensajes. Vuelve mañana."));
    }

    @Test
    void transcribeElAudioRecibidoPorMultipart() throws Exception {
        var audio = new MockMultipartFile("audio", "voz.m4a", "audio/m4a", new byte[]{1, 2, 3});
        when(transcribir.transcribir(eq(USUARIO), any(), eq("voz.m4a"))).thenReturn("suena un chillido al frenar");

        mockMvc.perform(multipart("/api/v1/transcripciones").file(audio).with(como(LAURA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.texto").value("suena un chillido al frenar"));
    }

    @Test
    void laSaludMuestraElCortacircuitosDeGroq() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.components.groq.status").value("UP"))
                .andExpect(jsonPath("$.components.groq.details.cortacircuitos").value("cerrado"));
    }
}
