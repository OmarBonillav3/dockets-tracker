# Dockets Tracker — Design Spec

**Fecha:** 2026-08-26
**Estado:** Aprobado para implementación

## Contexto y propósito

Herramienta personal (un solo usuario) para una paralegal en el despacho
**Carus Law**. Hoy, cada mes debe armar un "docket" — una tabla de todas las
tareas facturables que hizo — juntando información dispersa en su libreta,
correo y WhatsApp. El proceso actual: buscar en todos esos sitios, pegar todo
en ChatGPT para que lo ordene en tabla, y pegar el resultado en un template de
Word que envía a su jefa.

Objetivo: eliminar esa fricción con una app web donde ella registra la
información a medida que ocurre (o la pega en bloque desde sus notas
dispersas), la revisa agrupada por día, y exporta directamente un `.docx` que
replica su template exacto — sin tener que tocarlo después.

Es una herramienta de un solo usuario, sin necesidad de autenticación, cuentas
ni backend.

## Modelo de datos

**Matter** (cliente/caso del catálogo):
- `id`
- `name` (ej. "Gabriel Gonzalez Ocampo - Immigration Negligence")
- `caseNumber` (ej. "0024-002"), puede estar vacío
- `rate` (tarifa por hora, referencia — no se usa para calcular automáticamente el costo)
- `isPotentialClient` (bool) — para el matter especial "Sin número / Cliente potencial"

**Entry** (fila del docket):
- `id`
- `matterId` (referencia a Matter)
- `date`
- `task` (texto corto)
- `detailDescription` (texto largo)
- `timeSpent` (ej. "10 min", "1.5 hrs")
- `costAssociated` (texto/número, **siempre manual**)
- `status`: `draft` | `confirmed` (para la Revisión diaria)
- `createdAt`

Todo vive en `localStorage`, serializado como JSON. Configuración incluye
exportar/importar ese JSON completo como respaldo manual (no depende de un
solo navegador/dispositivo).

## Las 8 pantallas

### 1. Inicio / Captura rápida
Pantalla principal para agregar entradas rápido. Un toggle entre dos modos:

- **Pegar texto**: textarea donde ella pega un mensaje de WhatsApp, correo o
  nota suelta. Un parser heurístico local (ver sección de Parseo) separa el
  texto en posibles entradas (fecha, matter sugerido, task, detalle, tiempo) y
  las muestra como tarjetas editables. Ella corrige lo que haga falta y
  confirma cada una — nada se guarda sin su confirmación explícita.
- **Formulario manual**: campos directos (matter con autocompletado, fecha,
  task, detalle, tiempo, costo) para cuando prefiere escribir directo.

Incluye botón **"Repetir última tarea"** que precarga el formulario manual con
los valores de la entrada más reciente (mismo matter, mismo task), para tareas
recurrentes — solo cambia fecha/tiempo/detalle.

Las entradas nuevas entran con `status: draft`.

### 2. Revisión diaria
Lista de entradas agrupadas por día (todas, sin importar el filtro de mes,
pero con selector de mes/rango). Por cada día:
- Entradas en `draft` se pueden confirmar individualmente o **"confirmar
  todo el día"** en un clic (pasan a `confirmed`).
- Si un día del rango seleccionado no tiene ninguna entrada, se marca con una
  alerta visual ("día sin registros") para que no se le pase por alto perder
  horas facturables.

### 3. Catálogo de matters
Tabla de matters: nombre, número de caso, tarifa. Alta/edición/eliminación.
Incluye el matter especial fijo **"Sin número / Cliente potencial"** para
casos como "NO CASE #. Potential New Client. [Nombre]" — en ese caso el
nombre del cliente potencial se escribe en el campo Task o Detail de la
entrada, no como un matter nuevo por cada cliente.

### 4. Búsqueda
Buscador con filtros por cliente/matter, rango de fecha y palabra clave libre
(busca en task y detailDescription). Su propósito principal: que ella pueda
verificar rápido si ya registró algo antes de escribirlo de nuevo.

### 5. Resumen mensual
Selector de mes. Muestra:
- Total de horas del mes (suma de `timeSpent` parseado a horas).
- Total de costo del mes (suma de `costAssociated`).
- Desglose por matter (subtotal horas/costo por matter).
Sirve como paso de revisión antes de exportar, para confirmar que los números
cuadran.

### 6. Exportar
Selector de mes (mismo rango que el Resumen). Botón **"Generar docket
(.docx)"** que arma el archivo Word con el template exacto de Carus Law:
logo, columnas Matter name / Date / Task / Detail Description / Time Spent /
Cost Associated, en el mismo orden y estilo visual de la plantilla actual.
Solo incluye entradas en estado `confirmed`. Descarga directa del archivo,
lista para enviar sin edición manual.

### 7. Detalle de matter
Vista de un matter específico: sus datos (nombre, número, tarifa) y la lista
de todas sus entradas históricas, con acceso a editar cada una.

### 8. Configuración
- Datos del despacho/template (nombre del despacho, logo — usados en la
  exportación).
- Exportar/importar el respaldo completo de datos (JSON) para no depender de
  un solo navegador.

## Parseo heurístico de texto pegado

Sin llamadas a IA externa (sin API key, sin costo, funciona offline). Reglas
simples en el cliente:

- Divide el texto pegado por líneas o por patrones de fecha (`July 21`,
  `07/21`, etc.) para separar en entradas candidatas.
- Busca coincidencias de texto contra los nombres de matters existentes en el
  catálogo para sugerir el matter de cada entrada (fuzzy match simple sobre
  `matter.name`).
- Busca patrones de duración (`10 min`, `1.5 hrs`, `30m`) para sugerir
  `timeSpent`.
- El resto de la línea/bloque se sugiere como `detailDescription`, y una
  versión corta como `task`.
- Todo esto son **sugerencias editables** — el parser no necesita ser
  perfecto porque ella siempre revisa y confirma antes de guardar (mismo
  patrón que la pantalla de Revisión diaria).

## Generación de .docx

Se usa la librería `docx` (JS, cliente, sin backend) para construir el
archivo Word en el navegador y disparar la descarga. La estructura del
documento (logo, encabezados de columna, estilos de tabla) replica la foto de
referencia del template de Carus Law.

## Fuera de alcance (explícitamente removido)

- Cronómetro para medir tiempo en vivo — descartado por decisión explícita.
- Cálculo automático de `costAssociated` — es siempre un campo manual, no una
  fórmula de tarifa × tiempo.
- Backend, autenticación, multi-usuario, sincronización entre dispositivos —
  no aplica, es una herramienta personal de un solo usuario.
- Parseo con IA externa — se usa heurística local únicamente.

## Siguiente paso

El sistema visual (superficies en capas, radios, sombras, tipografía, acento
de color) se define y aplica por separado con la skill `frontend-design`,
una vez que la estructura funcional de las 8 pantallas esté lista. Este spec
cubre estructura, lógica y datos — no estilo visual.
