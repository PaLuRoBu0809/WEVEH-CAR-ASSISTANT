package co.weveh;

import static co.weveh.SesionDePrueba.como;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.weveh.cuentas.application.puertos.ProveedorIdentidad;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * ADR 0012: contracts/openapi.yaml es el que genera el código. Si un controlador cambia y el contrato no, esta
 * prueba falla en la CI. Para regenerarlo: {@code ./mvnw test -Dtest=ContratoOpenApiTest -Dweveh.contrato.escribir=true}.
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest(properties = "springdoc.api-docs.enabled=true")
@AutoConfigureMockMvc
class ContratoOpenApiTest {

    static final Path CONTRATO = Path.of("..", "contracts", "openapi.yaml");

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ProveedorIdentidad identidad;

    @Test
    void elContratoGuardadoEsElQueGeneraElCodigo() throws Exception {
        var generado = mockMvc.perform(get("/v3/api-docs.yaml").with(como("3f1c9a2e-8b4d-4f6a-9c1e-2d7b5a0e4c11")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        if (Boolean.getBoolean("weveh.contrato.escribir")) {
            Files.writeString(CONTRATO, generado, StandardCharsets.UTF_8);
        }

        assertThat(Files.readString(CONTRATO, StandardCharsets.UTF_8).replace("\r\n", "\n"))
                .as("contracts/openapi.yaml está desactualizado: regenéralo con -Dweveh.contrato.escribir=true")
                .isEqualTo(generado.replace("\r\n", "\n"));
    }
}
