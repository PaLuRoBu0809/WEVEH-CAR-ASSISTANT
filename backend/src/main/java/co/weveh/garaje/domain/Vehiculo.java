package co.weveh.garaje.domain;

import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.DispositivoId;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.TipoVehiculo;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Vehículo del garaje (skill dominio-vehiculo §1). Inmutable: cada cambio devuelve una copia.
 *
 * @param catalogoLineaId línea del catálogo del Ministerio; null si la persona la escribió a mano ("Lo revisaremos")
 * @param versionFila     control de concurrencia optimista (RF-GAR-03)
 */
public record Vehiculo(
        UUID id,
        DispositivoId dispositivo,
        TipoVehiculo tipo,
        Long catalogoLineaId,
        String marca,
        String linea,
        Integer cilindradaCc,
        int anioModelo,
        Combustible combustible,
        Transmision transmision,
        Traccion traccion,
        String alias,
        String placa,
        LocalDate fechaMatricula,
        Kilometraje km,
        UsoVehiculo uso,
        int kmPromedioMes,
        RegistroInicial registroInicial,
        int versionFila) {

    public static final int ANIO_MINIMO = 1950;
    public static final int KM_PROMEDIO_MES_POR_DEFECTO = 1_000;
    public static final int KM_PROMEDIO_MES_MAXIMO = 20_000;
    private static final int LARGO_MAXIMO_TEXTO = 80;
    private static final Pattern PLACA = Pattern.compile("^[A-Z0-9]{5,7}$");

    public Vehiculo {
        marca = Textos.limpio(marca);
        linea = Textos.limpio(linea);
        alias = Textos.limpio(alias);
        placa = normalizarPlaca(placa);
        uso = uso == null ? UsoVehiculo.MIXTO : uso;
    }

    /** Datos que la persona llena en el formulario de registro. */
    public record DatosRegistro(
            TipoVehiculo tipo,
            Long catalogoLineaId,
            String marca,
            String linea,
            Integer cilindradaCc,
            int anioModelo,
            Combustible combustible,
            Transmision transmision,
            Traccion traccion,
            String alias,
            String placa,
            LocalDate fechaMatricula,
            int km,
            UsoVehiculo uso,
            Integer kmPromedioMes,
            RegistroInicial registroInicial) {
    }

    /** RF-GAR-02. */
    public static Vehiculo registrar(UUID id, DispositivoId dispositivo, DatosRegistro datos, LocalDate hoy) {
        var vehiculo = new Vehiculo(id, dispositivo, datos.tipo(), datos.catalogoLineaId(), datos.marca(), datos.linea(),
                datos.cilindradaCc(), datos.anioModelo(), datos.combustible(), datos.transmision(), datos.traccion(),
                datos.alias(), datos.placa(), datos.fechaMatricula(), new Kilometraje(datos.km()), datos.uso(),
                datos.kmPromedioMes() == null ? KM_PROMEDIO_MES_POR_DEFECTO : datos.kmPromedioMes(),
                datos.registroInicial(), 0);
        vehiculo.validar(hoy);
        return vehiculo;
    }

    /** RF-GAR-03: lo que se puede corregir sin cambiar de vehículo. El kilometraje va por su propio caso (RF-GAR-05). */
    public Vehiculo editar(String nuevoAlias, String nuevaPlaca, UsoVehiculo nuevoUso, int nuevoKmPromedioMes,
                           LocalDate nuevaFechaMatricula, LocalDate hoy) {
        var editado = new Vehiculo(id, dispositivo, tipo, catalogoLineaId, marca, linea, cilindradaCc, anioModelo,
                combustible, transmision, traccion, nuevoAlias, nuevaPlaca, nuevaFechaMatricula, km, nuevoUso,
                nuevoKmPromedioMes, registroInicial, versionFila);
        editado.validar(hoy);
        return editado;
    }

    public String nombreParaMostrar() {
        return alias != null ? alias : marca + " " + linea;
    }

    private void validar(LocalDate hoy) {
        if (tipo == null) {
            throw new DatoInvalidoException("Elige si es carro o moto");
        }
        if (marca == null || linea == null) {
            throw new DatoInvalidoException("Falta la marca o la línea del vehículo");
        }
        if (marca.length() > LARGO_MAXIMO_TEXTO || linea.length() > LARGO_MAXIMO_TEXTO
                || (alias != null && alias.length() > LARGO_MAXIMO_TEXTO)) {
            throw new DatoInvalidoException("El texto es demasiado largo");
        }
        if (anioModelo < ANIO_MINIMO || anioModelo > hoy.getYear() + 1) {
            throw new DatoInvalidoException("El año modelo debe estar entre " + ANIO_MINIMO + " y " + (hoy.getYear() + 1));
        }
        if (cilindradaCc != null && cilindradaCc <= 0) {
            throw new DatoInvalidoException("La cilindrada debe ser mayor que cero");
        }
        if (kmPromedioMes < 0 || kmPromedioMes > KM_PROMEDIO_MES_MAXIMO) {
            throw new DatoInvalidoException("Los kilómetros al mes deben estar entre 0 y 20.000");
        }
        if (placa != null && !PLACA.matcher(placa).matches()) {
            throw new DatoInvalidoException("La placa debe tener entre 5 y 7 letras o números, por ejemplo ABC123");
        }
        if (fechaMatricula != null && (fechaMatricula.isAfter(hoy) || fechaMatricula.getYear() < anioModelo - 1)) {
            throw new DatoInvalidoException("Revisa la fecha de matrícula: no puede ser futura ni anterior al año del vehículo");
        }
        if (registroInicial == null) {
            throw new DatoInvalidoException("Faltan los datos del aceite y los papeles");
        }
        registroInicial.validar(km.valor(), hoy);
    }

    private static String normalizarPlaca(String placa) {
        var limpia = Textos.limpio(placa);
        return limpia == null ? null : limpia.replaceAll("[\\s-]", "").toUpperCase(Locale.ROOT);
    }
}
