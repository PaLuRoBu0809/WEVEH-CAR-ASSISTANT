package co.weveh.catalogo.domain;

import co.weveh.shared.domain.TipoVehiculo;
import java.math.BigDecimal;

/**
 * Línea comercial tal como la publica el Ministerio ("PRADO VX 5P AT"). Combustible, transmisión y tracción son
 * inferidos del nombre y pueden ser null (sin pista); {@code atributos} los completa con lo investigado y revisado y
 * dice de dónde sale cada uno (RF-CAT-04, ADR 0021).
 */
public record LineaCatalogo(
        long id,
        long marcaId,
        String nombre,
        String clase,
        TipoVehiculo tipoVehiculo,
        Integer cilindradaCc,
        BigDecimal potenciaKw,
        String combustible,
        String transmision,
        String traccion,
        Integer puertas,
        AtributosLinea atributos) {
}
