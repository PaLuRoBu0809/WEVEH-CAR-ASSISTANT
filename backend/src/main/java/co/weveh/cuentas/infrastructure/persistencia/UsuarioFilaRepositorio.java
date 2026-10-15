package co.weveh.cuentas.infrastructure.persistencia;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/** El id lo asigna Supabase Auth, así que las escrituras van con @Query en vez de save(). */
interface UsuarioFilaRepositorio extends Repository<UsuarioFila, UUID> {

    Optional<UsuarioFila> findById(UUID id);

    /** @return 1 si lo creó; 0 si ya existía (crear la cuenta es idempotente) */
    @Modifying
    @Query("insert into usuario (id, nombre) values (:id, :nombre) on conflict (id) do nothing")
    int insertarSiNoExiste(@Param("id") UUID id, @Param("nombre") String nombre);

    @Modifying
    @Query("update usuario set nombre = :nombre where id = :id")
    int cambiarNombre(@Param("id") UUID id, @Param("nombre") String nombre);

    @Modifying
    @Query("delete from usuario where id = :id")
    int eliminar(@Param("id") UUID id);
}
