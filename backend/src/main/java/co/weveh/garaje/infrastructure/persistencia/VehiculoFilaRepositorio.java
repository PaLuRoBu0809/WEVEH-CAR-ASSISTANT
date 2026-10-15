package co.weveh.garaje.infrastructure.persistencia;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

interface VehiculoFilaRepositorio extends CrudRepository<VehiculoFila, UUID> {

    List<VehiculoFila> findByDispositivoIdOrderByCreadoEn(UUID dispositivoId);

    Optional<VehiculoFila> findByIdAndDispositivoId(UUID id, UUID dispositivoId);

    @Modifying
    @Query("delete from vehiculo where id = :id and dispositivo_id = :dispositivoId")
    int eliminarDelDispositivo(@Param("id") UUID id, @Param("dispositivoId") UUID dispositivoId);
}
