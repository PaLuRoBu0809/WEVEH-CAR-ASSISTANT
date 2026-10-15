package co.weveh.cuentas.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Autorización de tratamiento de datos (Ley 1581 de 2012, RF-DAT-02): qué versión de la política aceptó la persona,
 * cuándo y por qué medio.
 */
public record Consentimiento(UUID id, UsuarioId usuario, String versionPolitica, Instant aceptadoEn,
                             MedioConsentimiento medio) {

    public Consentimiento {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(usuario, "usuario");
        Objects.requireNonNull(aceptadoEn, "aceptadoEn");
        Objects.requireNonNull(medio, "medio");
        if (versionPolitica == null || versionPolitica.isBlank()) {
            throw new DatoInvalidoException("Falta la versión de la política de tratamiento de datos");
        }
        versionPolitica = versionPolitica.strip();
    }
}
