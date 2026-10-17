package co.weveh;

import static co.weveh.SesionDePrueba.como;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
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
    void unUsuarioNuevoTieneElGarajeVacio() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").with(como(UUID.randomUUID().toString())))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://weveh.co/problemas/no-autenticado"));
    }

    @Test
    void conTokenAlteradoResponde401() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Authorization", "Bearer eyJhbGciOiJFUzI1NiJ9.alterado.firma"))
                .andExpect(status().isUnauthorized());
    }
}
