package co.weveh;

import static org.assertj.core.api.Assertions.assertThat;

import co.weveh.mecanicoia.application.puertos.ConsultaRepositorio;
import co.weveh.mecanicoia.domain.Diagnostico;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Persistencia de las consultas del Mecánico IA con Postgres real (RF-MIA-06, ADR 0006): el diagnóstico queda como
 * jsonb y el conteo del último día lo ve.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
class ConsultaRepositorioIntegracionTest {

    @Autowired
    ConsultaRepositorio consultas;

    @Autowired
    JdbcClient jdbc;

    @Test
    void guardaElDiagnosticoComoJsonbYLoCuentaEnElUltimoDia() {
        var vehiculoId = UUID.randomUUID();
        jdbc.sql("""
                        insert into vehiculo (id, dispositivo_id, tipo, marca, linea, anio_modelo, km, uso, km_promedio_mes, registro_soat_fecha)
                        values (?, ?, 'CARRO', 'TOYOTA', 'PRADO VX 5P AT', 2008, 190000, 'MIXTO', 1000, date '2026-06-30')""")
                .params(vehiculoId, UUID.randomUUID())
                .update();
        var consultaId = UUID.randomUUID();

        consultas.guardar(consultaId, vehiculoId, "suena un chillido al frenar", Diagnostico.respuestaSegura(),
                "modelo-de-prueba", "mecanico-v1");

        assertThat(consultas.contarUltimoDia(vehiculoId)).isEqualTo(1);
        var tipoJson = jdbc.sql("select jsonb_typeof(diagnostico) from consulta_mecanico where id = ?")
                .param(consultaId)
                .query(String.class)
                .single();
        assertThat(tipoJson).isEqualTo("object");
    }
}
