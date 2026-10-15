package co.weveh.cuentas.infrastructure.auth;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Borra a la persona en Supabase Auth con la API de administración (RF-DAT-06). Usa la llave service_role, que solo
 * existe en el backend.
 */
@Component
class ProveedorIdentidadSupabase implements ProveedorIdentidad {

    private static final Duration ESPERA_CONEXION = Duration.ofSeconds(5);
    private static final Duration ESPERA_RESPUESTA = Duration.ofSeconds(10);
    private static final String NO_DISPONIBLE = "Eliminar la cuenta no está disponible por ahora. Intenta en unos minutos";

    private final RestClient cliente;
    private final boolean configurado;

    ProveedorIdentidadSupabase(@Value("${weveh.supabase.url}") String url,
                               @Value("${weveh.supabase.service-role:}") String llaveServicio) {
        this.configurado = !llaveServicio.isBlank();
        var fabrica = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(ESPERA_CONEXION).build());
        fabrica.setReadTimeout(ESPERA_RESPUESTA);
        this.cliente = RestClient.builder()
                .baseUrl(url + "/auth/v1")
                .requestFactory(fabrica)
                .defaultHeader("apikey", llaveServicio)
                .defaultHeader("Authorization", "Bearer " + llaveServicio)
                .build();
    }

    @Override
    public void eliminarUsuario(UsuarioId usuario) {
        if (!configurado) {
            throw new ServicioNoDisponibleException(NO_DISPONIBLE);
        }
        try {
            cliente.delete().uri("/admin/users/{id}", usuario.valor()).retrieve().toBodilessEntity();
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return;
            }
            throw new ServicioNoDisponibleException(NO_DISPONIBLE);
        } catch (RestClientException error) {
            throw new ServicioNoDisponibleException(NO_DISPONIBLE);
        }
    }
}
