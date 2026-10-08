package co.weveh;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Prueba de integración con Postgres real (Testcontainers): Flyway corre y la API responde de punta a punta.
 * Necesita Docker; sin Docker se omite en local y siempre corre en la CI.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class WevehApplicationTests {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JdbcClient jdbc;

    @Test
    void flywayCreaElEsquemaCatalogo() {
        var existe = jdbc.sql("select count(*) from information_schema.schemata where schema_name = 'catalogo'")
                .query(Integer.class).single();

        assertThat(existe).isEqualTo(1);
    }

    @Test
    void elHistorialDeFlywayQuedaConRls() {
        var conRls = jdbc.sql("select relrowsecurity from pg_class where relname = 'flyway_schema_history'")
                .query(Boolean.class).single();

        assertThat(conRls).isTrue();
    }

    @Test
    void garajeVacioDePuntaAPunta() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("X-Weveh-Dispositivo", "3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }
}
