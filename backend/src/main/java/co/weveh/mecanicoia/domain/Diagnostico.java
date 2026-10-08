package co.weveh.mecanicoia.domain;

import java.util.List;

/**
 * Contrato de salida del Mecánico IA (skill mecanico-ia): el del README más los campos de acción.
 *
 * @param costoEstimado rango en COP o null; nunca una cifra cerrada ni inventada
 * @param seguro        true si es la respuesta segura (el modelo falló o se negó), no un diagnóstico del modelo
 */
public record Diagnostico(
        String posibleFalla,
        NivelGravedad nivelGravedad,
        String explicacionSimple,
        String accionInmediata,
        String costoEstimado,
        boolean requiereRevisionHumana,
        boolean requiereMecanico,
        List<String> piezasRelacionadas,
        List<String> datosFaltantes,
        boolean seguro) {

    public static final String AVISO = "Orientación, no reemplaza al mecánico";

    public Diagnostico {
        piezasRelacionadas = piezasRelacionadas == null ? List.of() : List.copyOf(piezasRelacionadas);
        datosFaltantes = datosFaltantes == null ? List.of() : List.copyOf(datosFaltantes);
    }

    /** Cuando el modelo no responde algo válido: nunca un diagnóstico a medias. */
    public static Diagnostico respuestaSegura() {
        return new Diagnostico(
                "No pudimos analizar el síntoma",
                NivelGravedad.MODERADO,
                "No logramos darte una orientación confiable en este momento.",
                "Si notas frenos raros, humo, recalentamiento o un testigo rojo, detén el vehículo y llama a un mecánico. "
                        + "Si no, intenta de nuevo en unos minutos.",
                null, true, false, List.of(), List.of(), true);
    }

    Diagnostico conGravedad(NivelGravedad nivel, boolean revisionHumana, boolean mecanico, String accion) {
        return new Diagnostico(posibleFalla, nivel, explicacionSimple, accion, costoEstimado, revisionHumana, mecanico,
                piezasRelacionadas, datosFaltantes, seguro);
    }

    Diagnostico sinCosto() {
        return new Diagnostico(posibleFalla, nivelGravedad, explicacionSimple, accionInmediata, null,
                requiereRevisionHumana, requiereMecanico, piezasRelacionadas, datosFaltantes, seguro);
    }
}
