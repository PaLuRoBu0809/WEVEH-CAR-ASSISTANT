package co.weveh.cuentas.infrastructure.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import co.weveh.shared.domain.ServicioNoDisponibleException;
import co.weveh.shared.domain.UsuarioId;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** RF-DAT-06: borrar a la persona en Supabase Auth. */
class ProveedorIdentidadSupabaseTest {

    private static final UsuarioId USUARIO = UsuarioId.desdeTexto("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11");
    private static final String LLAVE = "llave-service-role";

    private final AtomicInteger estadoRespuesta = new AtomicInteger(200);
    private final AtomicReference<String> metodo = new AtomicReference<>();
    private final AtomicReference<String> ruta = new AtomicReference<>();
    private final AtomicReference<String> autorizacion = new AtomicReference<>();
    private final AtomicReference<String> apikey = new AtomicReference<>();
    private HttpServer servidor;

    @BeforeEach
    void levantarServidor() throws IOException {
        servidor = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        servidor.createContext("/", intercambio -> {
            metodo.set(intercambio.getRequestMethod());
            ruta.set(intercambio.getRequestURI().getPath());
            autorizacion.set(intercambio.getRequestHeaders().getFirst("Authorization"));
            apikey.set(intercambio.getRequestHeaders().getFirst("apikey"));
            intercambio.sendResponseHeaders(estadoRespuesta.get(), -1);
            intercambio.close();
        });
        servidor.start();
    }

    @AfterEach
    void apagarServidor() {
        servidor.stop(0);
    }

    private ProveedorIdentidadSupabase proveedor(String llave) {
        return new ProveedorIdentidadSupabase("http://localhost:" + servidor.getAddress().getPort(), llave);
    }

    @Test
    void borraAlUsuarioConLaLlaveDeServicio() {
        proveedor(LLAVE).eliminarUsuario(USUARIO);

        assertThat(metodo.get()).isEqualTo("DELETE");
        assertThat(ruta.get()).isEqualTo("/auth/v1/admin/users/" + USUARIO.valor());
        assertThat(autorizacion.get()).isEqualTo("Bearer " + LLAVE);
        assertThat(apikey.get()).isEqualTo(LLAVE);
    }

    @Test
    void siYaNoExistiaEnSupabaseNoEsError() {
        estadoRespuesta.set(404);

        assertThatCode(() -> proveedor(LLAVE).eliminarUsuario(USUARIO)).doesNotThrowAnyException();
    }

    @Test
    void unErrorDeSupabaseSeReportaComoServicioNoDisponible() {
        estadoRespuesta.set(500);

        assertThatThrownBy(() -> proveedor(LLAVE).eliminarUsuario(USUARIO))
                .isInstanceOf(ServicioNoDisponibleException.class)
                .hasMessageContaining("no está disponible");
    }

    @Test
    void sinConexionConSupabaseSeReportaComoServicioNoDisponible() {
        var sinServidor = new ProveedorIdentidadSupabase("http://localhost:1", LLAVE);

        assertThatThrownBy(() -> sinServidor.eliminarUsuario(USUARIO))
                .isInstanceOf(ServicioNoDisponibleException.class);
    }

    @Test
    void sinLlaveDeServicioNoLlamaASupabase() {
        assertThatThrownBy(() -> proveedor(" ").eliminarUsuario(USUARIO))
                .isInstanceOf(ServicioNoDisponibleException.class);
        assertThat(metodo.get()).isNull();
    }
}
