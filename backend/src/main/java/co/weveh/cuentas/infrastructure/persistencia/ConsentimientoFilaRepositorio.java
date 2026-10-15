package co.weveh.cuentas.infrastructure.persistencia;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

interface ConsentimientoFilaRepositorio extends Repository<ConsentimientoFila, UUID> {

    List<ConsentimientoFila> findByUsuarioIdOrderByAceptadoEn(UUID usuarioId);

    @Modifying
    @Query("""
            insert into consentimiento (id, usuario_id, version_politica, aceptado_en, medio)
            values (:id, :usuarioId, :versionPolitica, :aceptadoEn, :medio)""")
    void insertar(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId,
                  @Param("versionPolitica") String versionPolitica, @Param("aceptadoEn") Instant aceptadoEn,
                  @Param("medio") String medio);
}
