package co.weveh.shared.infrastructure.monitoreo;

import io.sentry.Hint;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import org.springframework.stereotype.Component;

/**
 * ADR 0010 y RNF-23: a Sentry solo va lo técnico del error. Aunque {@code send-default-pii} ya está apagado, se borra
 * lo que pueda quedar de la persona: usuario (y su IP), cabeceras (Authorization lleva el token), cookies, cuerpo y
 * parámetros de la petición.
 */
@Component
class FiltroSentry implements SentryOptions.BeforeSendCallback {

    @Override
    public SentryEvent execute(SentryEvent evento, Hint pista) {
        evento.setUser(null);
        var peticion = evento.getRequest();
        if (peticion != null) {
            peticion.setHeaders(null);
            peticion.setCookies(null);
            peticion.setData(null);
            peticion.setQueryString(null);
            peticion.setEnvs(null);
        }
        return evento;
    }
}
