package co.weveh.shared.infrastructure.persistencia;

import javax.sql.DataSource;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/**
 * El historial de Flyway vive en "public" y Supabase lo expone por PostgREST: se le activa RLS sin políticas para que la
 * llave anon no lo lea (advisor rls_disabled_in_public). Va después de migrar, y no como migración o callback, porque
 * mientras Flyway migra mantiene un bloqueo sobre esa tabla y el ALTER TABLE se queda esperando hasta el timeout.
 */
@Configuration(proxyBeanMethods = false)
class ConfiguracionFlyway {

    @Bean
    FlywayMigrationStrategy migrarYProtegerHistorial(DataSource dataSource) {
        return flyway -> {
            flyway.migrate();
            var jdbc = JdbcClient.create(dataSource);
            var tabla = flyway.getConfiguration().getTable();
            var sinRls = jdbc.sql("""
                    select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname = current_schema() and c.relname = ? and not c.relrowsecurity
                    """).param(tabla).query(Integer.class).single();
            if (sinRls > 0) {
                jdbc.sql("alter table \"" + tabla + "\" enable row level security").update();
            }
        };
    }
}
