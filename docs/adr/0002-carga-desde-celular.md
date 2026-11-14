# 0002. La carga desde el celular es un Formulario que escribe en Movimientos

Fecha: 2026-11-14. Estado: aceptada (pendiente la prueba de copia desde otra cuenta).

## Contexto

El objetivo O2 del diseño pide cargar una compra desde el celular en unos 10 segundos, en el momento de
la compra. Las ofertas no llevan código (ADR 0001), así que no hay menús propios ni botones con script, y
la app móvil de Sheets es la única forma de ver la planilla en el teléfono. Había que decidir entre cargar
directo en la hoja desde la app, cargar con un Formulario de Google vinculado o ambas, y qué funciones de
Sheets se pueden usar sin romper la vista en la app.

## Prueba

Planilla desechable generada por script con Movimientos (desplegable de unas 30 subcategorías, Pagó y
Forma de pago), un Formulario vinculado con los mismos campos y una pestaña con una fórmula de cada tipo.
Probada por el autor en iOS y Android, el 2026-11-14.

| Aspecto | Resultado |
|---|---|
| Abrir la planilla en la app de Sheets | Menos de 5 s en ambos sistemas |
| Cargar un gasto en Movimientos desde la app | Funciona, menos de 5 s, pero menos cómodo que el Formulario |
| Cargar un gasto con el Formulario | El camino más cómodo en ambos sistemas; la respuesta llega a la planilla |
| `LET`, `LAMBDA` + `MAP`, `BYROW`, `QUERY`, `XLOOKUP`, `FILTER`, `SPARKLINE` de barra, formato condicional por texto | Muestran resultado en la computadora y en la app de iOS y Android |
| Copia desde otra cuenta de Google | Pendiente |

Los tiempos son estimaciones del autor, no cronometrados por carga.

## Opciones consideradas

- **Solo la hoja desde la app.** Funciona, pero los desplegables y el teclado en celdas chicas son más
  lentos e incómodos que el Formulario.
- **Formulario que escribe en Movimientos.** La pestaña Movimientos es la hoja de respuestas del
  Formulario y también admite escritura manual desde la computadora. Una sola tabla.
- **Formulario en una pestaña aparte, unida por fórmula.** Movimientos queda solo para lo manual y una capa
  de cálculo une ambas pestañas. No duplica datos, pero todas las fórmulas del Panel, Hormiga y Tarjeta
  leen de esa capa y es más lenta con miles de filas.
- **Formulario en Movimientos con una pregunta opcional de fecha.** Permite cargar compras atrasadas desde
  el celular, a costa de una columna y una fórmula de fecha efectiva fuera de Movimientos.

## Decisión

La carga desde el celular es un Formulario de Google vinculado cuyas respuestas caen en la pestaña
Movimientos. La carga directa en la hoja sigue disponible desde la computadora o la app.

- La primera columna de Movimientos es la marca de tiempo del Formulario y hace de fecha de la compra. Una
  compra de otro día se corrige editando esa celda.
- Las preguntas siguen el orden de las columnas de Movimientos: Monto, Moneda, Subcategoría, Pagó, Forma
  de pago, Tienda, Para quién y Nota. Origen no es pregunta: lo agrega el generador a la derecha.
- Moneda es opcional; vacía cuenta como la moneda principal, igual que en el oráculo.
- Subcategoría es un desplegable único `Categoría › Subcategoría`, sin dependencias entre preguntas.
- Funciones permitidas en las fórmulas de la planilla: las de la tabla de prueba. Cualquier otra se
  prueba en la app antes de usarse.

## Por qué

Es la opción más rápida en el celular y la única que mantiene una sola tabla de movimientos sin una capa
de cálculo intermedia. La marca de tiempo coincide con el objetivo de registrar en el momento de la
compra, y la corrección de fechas atrasadas es un caso poco frecuente que se resuelve editando una celda.

## Consecuencias

- El generador crea el Formulario con FormApp, lo vincula a la planilla y convierte la hoja de respuestas
  en Movimientos (nombre, columnas, validaciones). Como el vínculo se crea con la planilla en `en_US`, la
  hoja y la marca de tiempo salen con títulos en inglés y el generador los renombra.
- Renombrar una pregunta en el Formulario cambia el título de su columna; los rangos con nombre siguen
  funcionando, pero la guía de uso pide no renombrarlas.
- Las opciones del desplegable del Formulario no se actualizan solas desde Configuración (eso requeriría
  código). Cuando el usuario cambia categorías, las actualiza a mano en el Formulario; la guía lo explica.
- Queda pendiente confirmar que al copiar la planilla desde otra cuenta se copie el Formulario, siga
  vinculado y no aparezcan advertencias. Si falla, se revisa esta decisión antes de la Tarea 9.
