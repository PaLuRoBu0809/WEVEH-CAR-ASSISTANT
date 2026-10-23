package co.weveh.shared.infrastructure.monitoreo;

import static org.assertj.core.api.Assertions.assertThat;

import io.sentry.Hint;
import io.sentry.SentryEvent;
import io.sentry.protocol.Request;
import io.sentry.protocol.User;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** RNF-23: a Sentry no llega nombre, correo, IP, token ni lo que la persona escribió. */
class FiltroSentryTest {

    @Test
    void borraLaPersonaYLoSensibleDeLaPeticionPeroDejaLoTecnico() {
        var evento = new SentryEvent(new IllegalStateException("falló"));
        var usuario = new User();
        usuario.setEmail("laura@correo.com");
        usuario.setIpAddress("190.1.2.3");
        evento.setUser(usuario);
        var peticion = new Request();
        peticion.setUrl("https://weveh-backend.onrender.com/api/v1/vehiculos");
        peticion.setMethod("PUT");
        peticion.setHeaders(Map.of("Authorization", "Bearer secreto"));
        peticion.setCookies("sesion=secreta");
        peticion.setData("{\"alias\":\"La Prado\"}");
        peticion.setQueryString("q=toy");
        evento.setRequest(peticion);

        var filtrado = new FiltroSentry().execute(evento, new Hint());

        assertThat(filtrado.getUser()).isNull();
        assertThat(filtrado.getRequest().getHeaders()).isNull();
        assertThat(filtrado.getRequest().getCookies()).isNull();
        assertThat(filtrado.getRequest().getData()).isNull();
        assertThat(filtrado.getRequest().getQueryString()).isNull();
        assertThat(filtrado.getRequest().getUrl()).endsWith("/api/v1/vehiculos");
        assertThat(filtrado.getThrowable()).hasMessage("falló");
    }

    @Test
    void unEventoSinPeticionPasaIgual() {
        var evento = new SentryEvent();

        assertThat(new FiltroSentry().execute(evento, new Hint())).isSameAs(evento);
    }
}
