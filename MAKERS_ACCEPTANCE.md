# Gates Makers — revisión 2026-09-23

Referencia revisada: `origin/dev/Isaac`, integrada localmente en `makers/review`.

| Gate | Estado | Evidencia | Para cerrar |
|---|---|---|---|
| Arquitectura atribuible | PARCIAL | `docs/arquitectura.md`, atribuible a Isaac. | Pablo debe aportar y ambos defender backend, frontend y safety. |
| Uso de IA + evals | PARCIAL | Mecánico IA + validator; resultados no corresponden a la versión actual. | Reejecutar y versionar resultados nuevos. |
| Jailbreak y safety | PARCIAL | Hay prompt y pruebas del validator. | Medir falsos positivos/falsos negativos y adversariales end-to-end. |
| Mantenibilidad | NO PASA | El código propio está dividido, pero hay 5.280 archivos de `node_modules` rastreados. | El equipo debe retirarlos y verificar clon limpio. |
| Producto ejecutable | PASS | Spring Boot + React. | Acotar a triaje y recordatorios demostrables. |
| Git profesional | NO PASA | `dev/Isaac` y `dev/pablo` apuntan al mismo commit firmado por Isaac; sin CI. | Aportes separados, PR y CI. |

La rama docente no eliminará los archivos generados: la limpieza debe ser una contribución atribuible del equipo.
