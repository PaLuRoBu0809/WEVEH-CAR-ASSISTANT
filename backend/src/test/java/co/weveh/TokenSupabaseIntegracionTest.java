package co.weveh;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Valida tokens reales, sin simularlos (RNF-24): firmados con ES256 como los de Supabase Auth y con la llave publicada
 * en un JWKS local. Protege la configuración de application.yml (algoritmo, emisor, audiencia, vencimiento).
 */
@Testcontainers(disabledWithoutDocker = true)
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class TokenSupabaseIntegracionTest {

    private static final ECKey LLAVE = generarLlave("llave-supabase");
    private static final HttpServer JWKS = publicarJwks();
    private static final String URL_SUPABASE = "http://localhost:" + JWKS.getAddress().getPort();
    private static final String EMISOR = URL_SUPABASE + "/auth/v1";

    @Autowired
    MockMvc mockMvc;

    @DynamicPropertySource
    static void supabaseLocal(DynamicPropertyRegistry propiedades) {
        propiedades.add("weveh.supabase.url", () -> URL_SUPABASE);
    }

    @AfterAll
    static void apagarJwks() {
        JWKS.stop(0);
    }

    @Test
    void unTokenEs256DeSupabaseEntra() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Authorization", "Bearer " + token(LLAVE, "authenticated", Duration.ofHours(1))))
                .andExpect(status().isOk());
    }

    @Test
    void unTokenVencidoNoEntra() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Authorization", "Bearer " + token(LLAVE, "authenticated", Duration.ofHours(-1))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unTokenParaOtraAudienciaNoEntra() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos").header("Authorization", "Bearer " + token(LLAVE, "anon", Duration.ofHours(1))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unTokenFirmadoConOtraLlaveNoEntra() throws Exception {
        var ajena = generarLlave("llave-supabase");
        mockMvc.perform(get("/api/v1/vehiculos").header("Authorization", "Bearer " + token(ajena, "authenticated", Duration.ofHours(1))))
                .andExpect(status().isUnauthorized());
    }

    private static String token(ECKey llave, String audiencia, Duration vigencia) throws Exception {
        var ahora = Instant.now();
        var datos = new JWTClaimsSet.Builder()
                .subject(UUID.randomUUID().toString())
                .issuer(EMISOR)
                .audience(audiencia)
                .claim("email", SesionDePrueba.CORREO)
                .claim("role", "authenticated")
                .issueTime(Date.from(ahora.minus(Duration.ofMinutes(1))))
                .expirationTime(Date.from(ahora.plus(vigencia)))
                .build();
        var jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(llave.getKeyID()).build(), datos);
        jwt.sign(new ECDSASigner(llave));
        return jwt.serialize();
    }

    private static ECKey generarLlave(String id) {
        try {
            return new ECKeyGenerator(Curve.P_256).keyID(id).generate();
        } catch (Exception error) {
            throw new IllegalStateException(error);
        }
    }

    /** Publica la llave pública como lo hace Supabase en /auth/v1/.well-known/jwks.json. */
    private static HttpServer publicarJwks() {
        try {
            var servidor = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
            var cuerpo = new JWKSet(LLAVE.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
            servidor.createContext("/auth/v1/.well-known/jwks.json", intercambio -> {
                intercambio.getResponseHeaders().add("Content-Type", "application/json");
                intercambio.sendResponseHeaders(200, cuerpo.length);
                intercambio.getResponseBody().write(cuerpo);
                intercambio.close();
            });
            servidor.start();
            return servidor;
        } catch (IOException error) {
            throw new IllegalStateException(error);
        }
    }
}
