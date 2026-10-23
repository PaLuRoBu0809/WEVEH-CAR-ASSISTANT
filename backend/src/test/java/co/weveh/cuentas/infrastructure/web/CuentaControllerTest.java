package co.weveh.cuentas.infrastructure.web;

import static co.weveh.SesionDePrueba.como;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.cuentas.application.Cuentas;
import co.weveh.cuentas.application.Cuentas.Cuenta;
import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.MedioConsentimiento;
import co.weveh.cuentas.domain.Usuario;
import co.weveh.shared.domain.UsuarioId;
import co.weveh.shared.infrastructure.web.ConfiguracionSeguridad;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** RF-CTA-02 y RF-DAT-02: el medio con el que se aceptó la política al crear la cuenta. */
@WebMvcTest(CuentaController.class)
@Import(ConfiguracionSeguridad.class)
class CuentaControllerTest {

    private static final String USUARIO = "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11";
    private static final UsuarioId ID_USUARIO = UsuarioId.desdeTexto(USUARIO);
    private static final String POLITICA = "0.1-borrador";

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    Cuentas cuentas;

    static Cuenta cuenta(MedioConsentimiento medio) {
        var consentimiento = new Consentimiento(UUID.randomUUID(), ID_USUARIO, POLITICA,
                Instant.parse("2026-10-21T15:00:00Z"), medio);
        return new Cuenta(new Usuario(ID_USUARIO, "Laura"), List.of(consentimiento));
    }

    @Test
    void sinMedioSeCreaComoRegistroConCorreo() throws Exception {
        when(cuentas.crear(eq(ID_USUARIO), eq("Laura"), eq(POLITICA), isNull(), eq(MedioConsentimiento.APP_REGISTRO)))
                .thenReturn(cuenta(MedioConsentimiento.APP_REGISTRO));

        mockMvc.perform(post("/api/v1/cuenta")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consentimientos[0].medio").value("APP_REGISTRO"));
    }

    @Test
    void conGoogleGuardaEseMedio() throws Exception {
        when(cuentas.crear(eq(ID_USUARIO), eq("Laura"), eq(POLITICA), isNull(), eq(MedioConsentimiento.APP_GOOGLE)))
                .thenReturn(cuenta(MedioConsentimiento.APP_GOOGLE));

        mockMvc.perform(post("/api/v1/cuenta")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\",\"medio\":\"APP_GOOGLE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consentimientos[0].medio").value("APP_GOOGLE"));
    }

    @Test
    void unMedioDesconocidoEsUnaSolicitudInvalida() throws Exception {
        mockMvc.perform(post("/api/v1/cuenta")
                        .with(como(USUARIO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Laura\",\"versionPolitica\":\"0.1-borrador\",\"medio\":\"FAX\"}"))
                .andExpect(status().isBadRequest());

        verify(cuentas, never()).crear(any(), any(), any(), any(), any());
    }
}
