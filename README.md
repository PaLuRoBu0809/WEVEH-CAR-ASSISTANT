# 📧 Agente de Prioridad de Correos (DOG Dashboard)

Un agente de Inteligencia Artificial diseñado para profesionales corporativos y ejecutivos con alto volumen de correos. Este sistema extrae mensajes directamente desde Gmail, analiza su contenido con LLMs y genera un dashboard estructurado con la prioridad, un resumen rápido y la acción recomendada, optimizando el tiempo de gestión de la bandeja de entrada.

## 🚀 El Problema que Resuelve
Los filtros tradicionales de correo electrónico se basan en reglas estáticas o palabras clave que no entienden el contexto real. Esto provoca que correos críticos se pierdan entre boletines informativos, causando retrasos en la toma de decisiones. 

Este agente introduce un enfoque **Human-in-the-Loop**: la IA procesa, estructura y recomienda, pero el usuario toma la decisión final antes de actuar.

## ✨ Características Principales
* **Extracción Segura (IMAP):** Conexión directa a Gmail para leer los últimos correos ignorando formatos pesados y extrayendo solo texto útil.
* **Evaluación de Urgencia:** Clasificación automática de la prioridad (Alta, Media, Baja) entendiendo el contexto, no solo el asunto.
* **Resumen Inteligente:** Síntesis del correo en un máximo de dos líneas.
* **Extracción de Acciones:** Identificación clara de la tarea que el usuario debe realizar (ej. "Agendar reunión", "Responder con el informe").
* **Output Estructurado:** Uso de Pydantic para garantizar que la IA siempre devuelva un JSON válido y predecible.

## 🛠️ Tecnologías Utilizadas
* **Lenguaje:** Python 3.x
* **Librerías Core:** `imaplib`, `email`, `requests`, `pydantic`, `pandas`
* **IA / LLM:** Conexión a modelos de lenguaje vía [OpenRouter API](https://openrouter.ai/) (compatible con GPT-4o-mini, Claude 3.5 Sonnet, etc.)
* **Entorno Recomendado:** Google Colab / Jupyter Notebooks

## ⚙️ Arquitectura del Sistema

El flujo de datos sigue un contrato de producto estricto validado paso a paso:

1. **Input:** Extracción de los correos vía IMAP.
2. **Validación Determinista:** Verificación de conexión y formato del texto.
3. **Trabajo del Modelo (IA):** El LLM evalúa, resume y extrae tareas.
4. **Validación del Output:** Pydantic asegura la estructura de los datos (`prioridad`, `resumen`, `accion`).
5. **Decisión Humana:** El usuario aprueba o ajusta en el dashboard generado.

## 🔑 Configuración y Uso

Para correr este prototipo de manera local o en Google Colab, necesitas configurar dos variables de entorno (o *Secrets* en Colab):

1. `GMAIL_APP_PASS`: Contraseña de aplicación de tu cuenta de Google (no tu contraseña habitual).
2. `OPENROUTER_API_KEY`: Tu token de acceso para la API de OpenRouter.

### Ejecución Básica
```python
# El script principal extraerá los últimos correos y devolverá un análisis estructurado:
from tu_script import analizar_correo_con_ia

correo_ejemplo = "De: jefe@empresa.com\nAsunto: Informe de ventas urgente\nMensaje: Envíame el reporte actualizado antes de las 2 PM."
resultado = analizar_correo_con_ia(correo_ejemplo)

print(resultado)
# Output esperado: 
# {
#   "prioridad": "Alta",
#   "resumen": "Solicitud de informe de ventas para hoy antes de las 2 PM.",
#   "accion": "Enviar reporte actualizado."
# }
