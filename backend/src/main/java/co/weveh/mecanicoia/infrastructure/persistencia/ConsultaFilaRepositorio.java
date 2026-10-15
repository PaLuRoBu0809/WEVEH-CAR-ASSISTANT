package co.weveh.mecanicoia.infrastructure.persistencia;

import java.util.UUID;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

interface ConsultaFilaRepositorio extends Repository<ConsultaFila, UUID> {

    @Modifying
    @Query("""
            insert into consulta_mecanico (id, vehiculo_id, sintoma, nivel_gravedad, diagnostico, respuesta_segura, modelo, version_prompt)
            values (:id, :vehiculoId, :sintoma, :nivelGravedad, cast(:diagnostico as jsonb), :respuestaSegura, :modelo, :versionPrompt)""")
    void insertar(@Param("id") UUID id, @Param("vehiculoId") UUID vehiculoId, @Param("sintoma") String sintoma,
                  @Param("nivelGravedad") String nivelGravedad, @Param("diagnostico") String diagnostico,
                  @Param("respuestaSegura") boolean respuestaSegura, @Param("modelo") String modelo,
                  @Param("versionPrompt") String versionPrompt);

    @Query("select count(*) from consulta_mecanico where vehiculo_id = :vehiculoId and creado_en > now() - interval '1 day'")
    int contarUltimoDia(@Param("vehiculoId") UUID vehiculoId);
}
