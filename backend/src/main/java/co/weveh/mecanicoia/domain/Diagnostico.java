package co.weveh.mecanicoia.domain;

import java.util.List;
import java.util.stream.Stream;

/**
 * Contrato de salida del Mecánico IA (skill mecanico-ia, RF-MIA-01): qué puede ser, por qué importa y qué hacer en
 * máximo 3 pasos cortos. Sin precio: el costo se pide aparte (RF-MIA-01b).
 *
 * @param explicacionSimple "¿Por qué importa?": máximo 2 oraciones, sin jerga
 * @param pasos             qué hacer, de 1 a {@value #MAXIMO_PASOS} pasos cortos
 * @param seguro            true si es la respuesta segura (el modelo falló o se negó), no un diagnóstico del modelo
 */
public record Diagnostico(
        String posibleFalla,
        NivelGravedad nivelGravedad,
        String explicacionSimple,
        List<String> pasos,
        boolean requiereRevisionHumana,
        boolean requiereMecanico,
        List<String> piezasRelacionadas,
        List<String> datosFaltantes,
        boolean seguro) {

    public static final String AVISO = "Orientación, no reemplaza al mecánico";
    public static final int MAXIMO_PASOS = 3;

    public Diagnostico {
        pasos = pasos == null ? List.of() : pasos.stream().limit(MAXIMO_PASOS).toList();
        piezasRelacionadas = piezasRelacionadas == null ? List.of() : List.copyOf(piezasRelacionadas);
        datosFaltantes = datosFaltantes == null ? List.of() : List.copyOf(datosFaltantes);
    }

    /** Cuando el modelo no responde algo válido: nunca un diagnóstico a medias. */
    public static Diagnostico respuestaSegura() {
        return new Diagnostico(
                "No pudimos analizar el síntoma",
                NivelGravedad.MODERADO,
                "No logramos darte una orientación confiable en este momento.",
                List.of("Si notas frenos raros, humo, recalentamiento o un testigo rojo, detén el vehículo y llama a un mecánico.",
                        "Si no, intenta de nuevo en unos minutos."),
                true, false, List.of(), List.of(), true);
    }

    /** Sube la gravedad; si hay un paso que debe ir primero, lo antepone y conserva los del modelo hasta completar 3. */
    Diagnostico conGravedad(NivelGravedad nivel, boolean revisionHumana, boolean mecanico, String primerPaso) {
        var nuevosPasos = primerPaso == null
                ? pasos
                : Stream.concat(Stream.of(primerPaso), pasos.stream().filter(paso -> !paso.equals(primerPaso))).toList();
        return new Diagnostico(posibleFalla, nivel, explicacionSimple, nuevosPasos, revisionHumana, mecanico,
                piezasRelacionadas, datosFaltantes, seguro);
    }
}
