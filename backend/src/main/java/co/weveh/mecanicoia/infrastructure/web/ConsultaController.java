package co.weveh.mecanicoia.infrastructure.web;

import co.weveh.mecanicoia.application.ConsultarMecanico;
import co.weveh.mecanicoia.domain.Diagnostico;
import co.weveh.shared.domain.DispositivoId;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
class ConsultaController {

    private final ConsultarMecanico consultar;

    ConsultaController(ConsultarMecanico consultar) {
        this.consultar = consultar;
    }

    @PostMapping("/api/v1/vehiculos/{vehiculoId}/consultas")
    DiagnosticoRespuesta consultar(DispositivoId dispositivo, @PathVariable UUID vehiculoId, @RequestBody ConsultaSolicitud solicitud) {
        return DiagnosticoRespuesta.desde(consultar.consultar(dispositivo, vehiculoId, solicitud.sintoma()));
    }

    record ConsultaSolicitud(String sintoma) {
    }

    /**
     * @param nivel     código para la app (LEVE, MODERADO, CRITICO)
     * @param gravedad  texto del contrato ("Crítico", "Moderado", "Leve")
     */
    record DiagnosticoRespuesta(String posibleFalla, String nivel, String gravedad, String explicacionSimple,
                                String accionInmediata, String costoEstimado, boolean requiereRevisionHumana,
                                boolean requiereMecanico, List<String> piezasRelacionadas, List<String> datosFaltantes,
                                boolean respuestaSegura, String aviso) {

        static DiagnosticoRespuesta desde(Diagnostico d) {
            return new DiagnosticoRespuesta(d.posibleFalla(), d.nivelGravedad().name(), d.nivelGravedad().texto(),
                    d.explicacionSimple(), d.accionInmediata(), d.costoEstimado(), d.requiereRevisionHumana(),
                    d.requiereMecanico(), d.piezasRelacionadas(), d.datosFaltantes(), d.seguro(), Diagnostico.AVISO);
        }
    }
}
