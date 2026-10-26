package co.weveh;

import static org.assertj.core.api.Assertions.assertThat;

import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio;
import co.weveh.mecanicoia.application.puertos.ConversacionRepositorio.Mensaje;
import co.weveh.mecanicoia.application.puertos.UsoIaRepositorio;
import co.weveh.mecanicoia.domain.CausaCritica;
import co.weveh.mecanicoia.domain.Plazo;
import co.weveh.mecanicoia.domain.RolMensaje;
import co.weveh.mecanicoia.domain.ValidadorSeguridadDiagnostico;
import co.weveh.shared.domain.UsuarioId;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Conversaciones del Mecánico IA con Postgres real (V12, RF-MIA-02, RF-MIA-06 y RF-MIA-07): la tarjeta vuelve con su
 * plazo, el historial sale en orden y el tope cuenta por cuenta.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ConversacionRepositorioIntegracionTest {

    @Autowired
    ConversacionRepositorio conversaciones;

    @Autowired
    UsoIaRepositorio uso;

    @Autowired
    JdbcClient jdbc;

    UUID vehiculoDe(UUID usuarioId) {
        var vehiculoId = UUID.randomUUID();
        jdbc.sql("insert into usuario (id, nombre) values (?, 'Laura')").param(usuarioId).update();
        jdbc.sql("""
                        insert into vehiculo (id, usuario_id, tipo, marca, linea, anio_modelo, km, uso, km_promedio_mes, registro_soat_fecha)
                        values (?, ?, 'CARRO', 'TOYOTA', 'PRADO VX 5P AT', 2008, 190000, 'MIXTO', 1000, date '2026-06-30')""")
                .params(vehiculoId, usuarioId)
                .update();
        return vehiculoId;
    }

    @Test
    void guardaLaConversacionYDevuelveLosMensajesEnOrdenConLaTarjeta() {
        var vehiculoId = vehiculoDe(UUID.randomUUID());
        var conversacionId = UUID.randomUUID();
        conversaciones.crear(conversacionId, vehiculoId);
        var tarjeta = ValidadorSeguridadDiagnostico.tarjetaPorSenal(CausaCritica.FRENOS, false);

        conversaciones.guardar(conversacionId,
                new Mensaje(UUID.randomUUID(), RolMensaje.PERSONA, "no frena bien", null, Instant.now()), null, null);
        conversaciones.guardar(conversacionId,
                new Mensaje(UUID.randomUUID(), RolMensaje.MECANICO, "Podrían ser las pastillas.", tarjeta, Instant.now()),
                "modelo:free", "mecanico-v3");
        conversaciones.guardar(conversacionId,
                new Mensaje(UUID.randomUUID(), RolMensaje.PERSONA, "¿y el líquido?", null, Instant.now()), null, null);

        assertThat(conversaciones.existe(conversacionId, vehiculoId)).isTrue();
        assertThat(conversaciones.existe(conversacionId, UUID.randomUUID())).isFalse();
        var mensajes = conversaciones.mensajes(conversacionId);
        assertThat(mensajes).extracting(Mensaje::texto).containsExactly("no frena bien", "Podrían ser las pastillas.", "¿y el líquido?");
        assertThat(mensajes.get(1).tarjeta().plazo()).isEqualTo(Plazo.NO_MANEJAR);
        assertThat(conversaciones.ultimos(conversacionId, 2)).extracting(Mensaje::texto)
                .containsExactly("Podrían ser las pastillas.", "¿y el líquido?");
        assertThat(conversaciones.listar(vehiculoId)).singleElement()
                .satisfies(resumen -> assertThat(resumen.primerMensaje()).isEqualTo("no frena bien"));
    }

    @Test
    void elUsoSeCuentaPorCuentaEnElUltimoDia() {
        var usuarioId = UUID.randomUUID();
        vehiculoDe(usuarioId);
        var usuario = new UsuarioId(usuarioId);

        uso.registrar(usuario, UsoIaRepositorio.Tipo.MENSAJE);
        uso.registrar(usuario, UsoIaRepositorio.Tipo.AUDIO);

        assertThat(uso.contarUltimoDia(usuario)).isEqualTo(2);
        assertThat(uso.contarUltimoDia(new UsuarioId(UUID.randomUUID()))).isZero();
    }
}
