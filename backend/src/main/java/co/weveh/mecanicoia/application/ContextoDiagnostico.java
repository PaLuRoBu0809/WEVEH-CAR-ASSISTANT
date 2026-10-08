package co.weveh.mecanicoia.application;

import co.weveh.garaje.GarajeApi.DatosVehiculo;
import java.time.LocalDate;

/**
 * Lo único que va al modelo (skill mecanico-ia, "Contexto que recibe el modelo"). Nunca placa, alias ni dispositivo.
 * El síntoma va aparte y el prompt lo trata como dato, no como instrucción.
 */
record ContextoDiagnostico(Vehiculo vehiculo, UltimoAceite ultimoAceite, String sintoma) {

    record Vehiculo(String tipo, String marca, String linea, Integer cilindradaCc, int anio, String combustible,
                    String transmision, String traccion, int km, String uso, int kmPromedioMes) {
    }

    record UltimoAceite(Integer km, LocalDate fecha) {
    }

    static ContextoDiagnostico de(DatosVehiculo v, String sintoma) {
        var vehiculo = new Vehiculo(v.tipo(), v.marca(), v.linea(), v.cilindradaCc(), v.anioModelo(), v.combustible(),
                v.transmision(), v.traccion(), v.km(), v.uso(), v.kmPromedioMes());
        var aceite = v.aceiteKm() == null ? null : new UltimoAceite(v.aceiteKm(), v.aceiteFecha());
        return new ContextoDiagnostico(vehiculo, aceite, sintoma);
    }
}
