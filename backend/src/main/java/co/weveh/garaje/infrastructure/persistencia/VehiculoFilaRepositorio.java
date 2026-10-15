package co.weveh.garaje.infrastructure.persistencia;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

interface VehiculoFilaRepositorio extends CrudRepository<VehiculoFila, UUID> {

    List<VehiculoFila> findByUsuarioIdOrderByCreadoEn(UUID usuarioId);

    Optional<VehiculoFila> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    @Modifying
    @Query("delete from vehiculo where id = :id and usuario_id = :usuarioId")
    int eliminarDelUsuario(@Param("id") UUID id, @Param("usuarioId") UUID usuarioId);
}
