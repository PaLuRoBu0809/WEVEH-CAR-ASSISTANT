package co.weveh.garaje.domain;

import co.weveh.shared.domain.ConfirmacionRequeridaException;
import co.weveh.shared.domain.DatoInvalidoException;
import co.weveh.shared.domain.Kilometraje;
import co.weveh.shared.domain.TipoVehiculo;
import co.weveh.shared.domain.UsuarioId;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Vehículo del garaje (skill dominio-vehiculo §1). Inmutable: cada cambio devuelve una copia.
 *
 * @param catalogoLineaId línea del catálogo del Ministerio; null si la persona la escribió a mano ("Lo revisaremos")
 * @param kmActualizadoEn día de la última lectura del kilometraje: define qué salto es normal (RF-GAR-05)
 * @param versionFila     control de concurrencia optimista (RF-GAR-03)
 */
public record Vehiculo(
        UUID id,
        UsuarioId usuario,
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
        LocalDate kmActualizadoEn,
        UsoVehiculo uso,
        int kmPromedioMes,
        RegistroInicial registroInicial,
        int versionFila) {

    public static final int ANIO_MINIMO = 1950;
    public static final int KM_PROMEDIO_MES_POR_DEFECTO = 1_000;
    public static final int KM_PROMEDIO_MES_MAXIMO = 20_000;
    /** RF-GAR-05: un salto hasta este tamaño nunca pide confirmación. */
    public static final int SALTO_KM_SIN_CONFIRMAR = 1_500;
    /** RF-GAR-05: se confirma un salto mayor a este múltiplo de lo que suele andar en esos días. */
    private static final int MULTIPLO_SALTO_NORMAL = 3;
    private static final double DIAS_POR_MES = 30.0;
    private static final Locale COLOMBIA = Locale.forLanguageTag("es-CO");
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

    /** RF-GAR-02: obligatorios solo tipo, marca, línea, año y kilometraje; aceite y papeles pueden quedar para después. */
    public static Vehiculo registrar(UUID id, UsuarioId usuario, DatosRegistro datos, LocalDate hoy) {
        var vehiculo = new Vehiculo(id, usuario, datos.tipo(), datos.catalogoLineaId(), datos.marca(), datos.linea(),
                datos.cilindradaCc(), datos.anioModelo(), datos.combustible(), datos.transmision(), datos.traccion(),
                datos.alias(), datos.placa(), datos.fechaMatricula(), new Kilometraje(datos.km()), hoy, datos.uso(),
                datos.kmPromedioMes() == null ? KM_PROMEDIO_MES_POR_DEFECTO : datos.kmPromedioMes(),
                datos.registroInicial() == null ? RegistroInicial.VACIO : datos.registroInicial(), 0);
        vehiculo.validar(hoy);
        return vehiculo;
    }

    /** RF-GAR-02b: agrega (o corrige) el aceite y los papeles que quedaron para después, con las mismas reglas. */
    public Vehiculo completarRegistro(RegistroInicial nuevoRegistro, LocalDate hoy) {
        var completado = new Vehiculo(id, usuario, tipo, catalogoLineaId, marca, linea, cilindradaCc, anioModelo,
                combustible, transmision, traccion, alias, placa, fechaMatricula, km, kmActualizadoEn, uso,
                kmPromedioMes, nuevoRegistro == null ? RegistroInicial.VACIO : nuevoRegistro, versionFila);
        completado.validar(hoy);
        return completado;
    }

    /**
     * RF-GAR-05: el kilometraje nunca baja, y un salto mayor a lo esperado pide confirmación.
     *
     * @param confirmado la persona ya confirmó que el salto es correcto
     * @throws ConfirmacionRequeridaException si el salto es raro y no está confirmado
     */
    public Vehiculo actualizarKilometraje(int nuevoKm, boolean confirmado, LocalDate hoy) {
        if (nuevoKm < km.valor()) {
            throw new DatoInvalidoException("El kilometraje no puede bajar: hoy tiene " + miles(km.valor()) + " km");
        }
        var nuevo = new Kilometraje(nuevoKm);
        var salto = nuevoKm - km.valor();
        if (!confirmado && salto > saltoEsperadoMaximo(hoy)) {
            throw new ConfirmacionRequeridaException("Subió " + miles(salto) + " km desde la última vez. ¿Es correcto?");
        }
        return new Vehiculo(id, usuario, tipo, catalogoLineaId, marca, linea, cilindradaCc, anioModelo, combustible,
                transmision, traccion, alias, placa, fechaMatricula, nuevo, hoy, uso, kmPromedioMes, registroInicial,
                versionFila);
    }

    /** max(3 × km promedio diario × días desde la última lectura, 1.500) (RF-GAR-05). */
    public int saltoEsperadoMaximo(LocalDate hoy) {
        var dias = Math.max(0, ChronoUnit.DAYS.between(kmActualizadoEn, hoy));
        var esperado = MULTIPLO_SALTO_NORMAL * (kmPromedioMes / DIAS_POR_MES) * dias;
        return (int) Math.max(esperado, SALTO_KM_SIN_CONFIRMAR);
    }

    private static String miles(int valor) {
        return String.format(COLOMBIA, "%,d", valor);
    }

    public List<DatoFaltante> datosFaltantes() {
        return registroInicial.datosFaltantes();
    }

    /**
     * Lo que la persona puede corregir del vehículo (RF-GAR-03). Combustible, transmisión y tracción en null conservan
     * el valor actual: la versión de la app que no los envía no los borra.
     */
    public record DatosEdicion(
            String alias,
            String placa,
            UsoVehiculo uso,
            int kmPromedioMes,
            LocalDate fechaMatricula,
            Combustible combustible,
            Transmision transmision,
            Traccion traccion) {
    }

    /** RF-GAR-03: lo que se puede corregir sin cambiar de vehículo. El kilometraje va por su propio caso (RF-GAR-05). */
    public Vehiculo editar(DatosEdicion datos, LocalDate hoy) {
        var editado = new Vehiculo(id, usuario, tipo, catalogoLineaId, marca, linea, cilindradaCc, anioModelo,
                nuevoOActual(datos.combustible(), combustible), nuevoOActual(datos.transmision(), transmision),
                nuevoOActual(datos.traccion(), traccion), datos.alias(), datos.placa(), datos.fechaMatricula(), km,
                kmActualizadoEn, datos.uso(), datos.kmPromedioMes(), registroInicial, versionFila);
        editado.validar(hoy);
        return editado;
    }

    private static <T> T nuevoOActual(T nuevo, T actual) {
        return nuevo == null ? actual : nuevo;
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
