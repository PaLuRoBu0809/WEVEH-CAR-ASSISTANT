import { VERSION_POLITICA } from './formularios';

/**
 * Texto de docs/legal/politica-tratamiento-datos-BORRADOR.md para leerlo en la app y en la demo web (RF-DAT-01).
 * Las tablas del documento quedan como listas. politica.test.ts revisa que las secciones y la versión coincidan:
 * si cambias el documento, cambia esto en el mismo PR.
 */
export type BloquePolitica = Readonly<{ parrafo: string }> | Readonly<{ lista: readonly string[] }>;

export type SeccionPolitica = Readonly<{ titulo: string; bloques: readonly BloquePolitica[] }>;

export const POLITICA = {
  titulo: 'Política de tratamiento de datos personales de WEVEH',
  version: VERSION_POLITICA,
  aviso:
    'Borrador para revisión legal (versión 0.1). Lo marcado [POR DEFINIR] necesita una decisión legal o del equipo. ' +
    'Marco: Ley 1581 de 2012, Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015) y demás normas que los modifiquen.',
  secciones: [
    {
      titulo: '1. Responsable del tratamiento',
      bloques: [
        {
          lista: [
            'Nombre: WEVEH [POR DEFINIR: razón social o persona natural responsable]',
            'Identificación: [POR DEFINIR: NIT o cédula]',
            'Domicilio: [POR DEFINIR], Colombia',
            'Correo de contacto para datos personales: [POR DEFINIR]',
          ],
        },
      ],
    },
    {
      titulo: '2. Qué datos tratamos',
      bloques: [
        {
          lista: [
            'Identificación y contacto: nombre y correo electrónico. Obligatorios para tener una cuenta.',
            'Datos del vehículo: tipo, marca, línea, año, kilometraje, uso, fechas de SOAT, revisión técnico-mecánica y seguro, historial de mantenimiento, fallas, tanqueadas; alias y placa (opcionales). Son obligatorios marca, línea, año y kilometraje; lo demás es opcional.',
            'Consultas al Mecánico IA: lo que la persona escribe y las respuestas. Solo si usa el asistente.',
            'Fotos: facturas y tablero que la persona decida subir; se guardan solo como evidencia y ningún modelo de IA las lee. Opcionales.',
            'Datos técnicos: registros de errores y de funcionamiento, sin nombre, correo ni credenciales. Automáticos.',
          ],
        },
        {
          parrafo:
            'No tratamos cédula, teléfono, ubicación, datos de pago ni datos sensibles. La placa es opcional y nunca se comparte con terceros ni con modelos de IA.',
        },
      ],
    },
    {
      titulo: '3. Para qué los usamos (finalidades)',
      bloques: [
        {
          lista: [
            'Crear y administrar la cuenta, y verificar la identidad al iniciar sesión.',
            'Prestar el servicio: guardar los vehículos, calcular el plan de mantenimiento y los vencimientos, y enviar avisos.',
            'Responder las consultas del Mecánico IA con el contexto del vehículo.',
            'Investigar el plan de mantenimiento de un modelo de vehículo en fuentes públicas.',
            'Mantener la seguridad y el funcionamiento de la app (detección de errores y abusos).',
            'Mejorar la app con información agregada que no identifica a nadie.',
          ],
        },
        { parrafo: 'No vendemos ni cedemos datos personales a terceros para publicidad.' },
      ],
    },
    {
      titulo: '4. Con quién se comparten (encargados) y transferencia internacional',
      bloques: [
        {
          parrafo:
            'Los datos se procesan con proveedores que actúan como encargados, con servidores fuera de Colombia (transferencia internacional [POR DEFINIR: base legal y cláusulas con cada proveedor]):',
        },
        {
          lista: [
            'Supabase, base de datos y cuentas: todos los datos de la cuenta y de los vehículos.',
            'Render, servidor de la aplicación: los datos en tránsito para prestar el servicio.',
            'OpenRouter y proveedores de modelos de IA gratuitos, Mecánico IA: solo datos del vehículo y el texto de la pregunta; nunca nombre, correo, identificador, placa ni alias. Los modelos gratuitos pueden conservar o usar las consultas, por eso la app pide no escribir datos personales en las preguntas.',
            'Brave Search, buscar información técnica de un modelo de vehículo: solo marca, línea, año y cilindrada.',
            'Sentry, detección de errores: datos técnicos sin nombre, correo ni credenciales.',
            'Google, iniciar sesión con Google si la persona lo elige: lo que Google comparte para identificar la cuenta (nombre y correo).',
          ],
        },
      ],
    },
    {
      titulo: '5. Derechos del titular',
      bloques: [
        { parrafo: 'La persona puede:' },
        {
          lista: [
            'Conocer sus datos (en la app: Perfil → Mis datos).',
            'Actualizar y rectificar sus datos (Perfil).',
            'Suprimir sus datos eliminando la cuenta (Perfil → Eliminar mi cuenta); se borra todo en menos de 24 horas.',
            'Revocar la autorización (equivale a eliminar la cuenta).',
            'Pedir prueba de la autorización otorgada.',
            'Ser informada sobre el uso de sus datos.',
            'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de haber consultado o reclamado ante WEVEH.',
          ],
        },
      ],
    },
    {
      titulo: '6. Cómo ejercer los derechos (procedimiento)',
      bloques: [
        {
          lista: [
            'Desde la app (Perfil) o escribiendo a [POR DEFINIR: correo de contacto].',
            'Consultas: respuesta en máximo 10 días hábiles (prorrogables 5 más, informando el motivo).',
            'Reclamos (corrección, actualización, supresión o incumplimiento): respuesta en máximo 15 días hábiles (prorrogables 8 más, informando el motivo).',
          ],
        },
      ],
    },
    {
      titulo: '7. Autorización',
      bloques: [
        {
          parrafo:
            'Se pide al crear la cuenta con una casilla sin marcar: "Acepto la política de tratamiento de datos personales". Quien entra con Google la acepta con la misma casilla la primera vez, en la pantalla "Antes de entrar". Sin aceptarla no se puede crear la cuenta. Se guarda la fecha, la versión de esta política y el medio. Si la política cambia, se pide aceptar la nueva versión al entrar.',
        },
      ],
    },
    {
      titulo: '8. Seguridad',
      bloques: [
        {
          parrafo:
            'Contraseñas gestionadas por Supabase Auth (nunca las guarda WEVEH), comunicación cifrada (HTTPS), base de datos sin acceso público (RLS), mínimos datos personales y ningún dato personal en los registros técnicos ni en las consultas a la IA.',
        },
      ],
    },
    {
      titulo: '9. Conservación',
      bloques: [
        {
          parrafo:
            'Los datos se conservan mientras la cuenta esté activa. Al eliminarla, se borran en menos de 24 horas. [POR DEFINIR: plazo de conservación de copias de respaldo y de registros técnicos].',
        },
      ],
    },
    {
      titulo: '10. Vigencia y cambios',
      bloques: [
        {
          lista: [
            `Versión: ${VERSION_POLITICA} · Fecha: 2026-10-10 · [POR DEFINIR: fecha de entrada en vigencia]`,
            'Los cambios importantes se informan en la app y requieren aceptar la nueva versión.',
          ],
        },
      ],
    },
  ] satisfies readonly SeccionPolitica[],
} as const;

/** Resumen de la pantalla "Antes de entrar" (mockup 7). Las fotos son solo evidencia (docs/adr/0018). */
export const RESUMEN_POLITICA: readonly string[] = [
  'Usamos tus datos de cuenta y de tu vehículo para avisarte de mantenimientos y responder tus dudas.',
  'Las fotos que subas, como facturas o el tablero, se guardan solo como evidencia: ninguna inteligencia artificial las lee.',
  'Puedes ver, corregir o borrar tus datos cuando quieras.',
];
