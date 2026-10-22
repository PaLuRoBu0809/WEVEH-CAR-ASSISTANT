package co.weveh.cuentas.infrastructure.web;

import co.weveh.cuentas.application.Cuentas;
import co.weveh.cuentas.application.Cuentas.Cuenta;
import co.weveh.cuentas.domain.Consentimiento;
import co.weveh.cuentas.domain.MedioConsentimiento;
import co.weveh.shared.domain.UsuarioId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** RF-CTA y RF-DAT (docs/api.md, "Cuentas y datos"). El correo sale del token: lo guarda Supabase Auth. */
@RestController
@RequestMapping("/api/v1/cuenta")
class CuentaController {

    private static final String RUTA = "/api/v1/cuenta";

    private final Cuentas cuentas;

    CuentaController(Cuentas cuentas) {
        this.cuentas = cuentas;
    }

    @PostMapping
    ResponseEntity<CuentaRespuesta> crear(UsuarioId usuario, @AuthenticationPrincipal Jwt token,
                                          @Valid @RequestBody CreacionSolicitud solicitud) {
        var cuenta = cuentas.crear(usuario, solicitud.nombre(), solicitud.versionPolitica(), solicitud.aceptadoEn(),
                solicitud.medioOPorDefecto());
        return ResponseEntity.created(URI.create(RUTA)).body(CuentaRespuesta.desde(cuenta, token));
    }

    @GetMapping
    CuentaRespuesta obtener(UsuarioId usuario, @AuthenticationPrincipal Jwt token) {
        return CuentaRespuesta.desde(cuentas.obtener(usuario), token);
    }

    @PutMapping
    CuentaRespuesta editar(UsuarioId usuario, @AuthenticationPrincipal Jwt token,
                           @Valid @RequestBody EdicionSolicitud solicitud) {
        return CuentaRespuesta.desde(cuentas.editarNombre(usuario, solicitud.nombre()), token);
    }

    @PostMapping("/consentimientos")
    ResponseEntity<CuentaRespuesta> aceptarPolitica(UsuarioId usuario, @AuthenticationPrincipal Jwt token,
                                                    @Valid @RequestBody ConsentimientoSolicitud solicitud) {
        var cuenta = cuentas.aceptarPolitica(usuario, solicitud.versionPolitica());
        return ResponseEntity.created(URI.create(RUTA)).body(CuentaRespuesta.desde(cuenta, token));
    }

    @DeleteMapping
    ResponseEntity<Void> eliminar(UsuarioId usuario, @AuthenticationPrincipal Jwt token) {
        cuentas.eliminar(usuario, token.getIssuedAt());
        return ResponseEntity.noContent().build();
    }

    /**
     * @param aceptadoEn cuándo marcó la casilla al crear la cuenta; si falta se usa la hora del servidor
     * @param medio      dónde la marcó; si falta, en el registro con correo
     */
    record CreacionSolicitud(@NotBlank String nombre, @NotBlank String versionPolitica, Instant aceptadoEn,
                             MedioConsentimiento medio) {

        MedioConsentimiento medioOPorDefecto() {
            return medio == null ? MedioConsentimiento.APP_REGISTRO : medio;
        }
    }

    record EdicionSolicitud(@NotBlank String nombre) {
    }

    record ConsentimientoSolicitud(@NotBlank String versionPolitica) {
    }

    record CuentaRespuesta(String nombre, String correo, List<ConsentimientoRespuesta> consentimientos) {

        static CuentaRespuesta desde(Cuenta cuenta, Jwt token) {
            return new CuentaRespuesta(cuenta.usuario().nombre(), token.getClaimAsString("email"),
                    cuenta.consentimientos().stream().map(ConsentimientoRespuesta::desde).toList());
        }
    }

    record ConsentimientoRespuesta(String versionPolitica, Instant aceptadoEn, String medio) {

        static ConsentimientoRespuesta desde(Consentimiento c) {
            return new ConsentimientoRespuesta(c.versionPolitica(), c.aceptadoEn(), c.medio().name());
        }
    }
}
