# Presupuesto Master 2: hoja anual (opción B)

Fecha: 2026-11-22. Estado: borrador para aprobación.

Reemplaza en la versión 2 el modelo de una fila por movimiento del diseño del 2026-11-13
(`docs/superpowers/specs/2026-11-13-presupuesto-master-2-design.md`). De ese diseño siguen valiendo
la intención del producto, las ofertas, las restricciones (sin código en la copia vendida, app
móvil, configuración regional) y los anti-objetivos, salvo donde este documento diga otra cosa.

## Intención

Presupuesto Master es la plantilla de Google Sheets que Vicky vende a su audiencia; cada comprador
hace una copia en su Drive. La familia usa además su copia "Presupuesto Morchis 2026".

Lo que Juan pidió para la versión 2:

- Un aspecto visual mucho mejor, que llame la atención, porque es un producto que se vende.
- Que el manejo mes a mes sea igual de fácil o más que hoy, y que **abrir un mes nuevo sea
  supremamente fácil**.
- Que personalizar (moneda, personas, formas de pago, categorías) sea fácil y abarque todo lo
  posible.
- Mantener el modelo que conocen: por cada renglón, **lo presupuestado** (lo que piensan gastar) y
  **lo real** (lo gastado, que puede quedar por debajo o por encima).
- Saber sin sumas aparte **cuánto se paga en efectivo**, en total y por persona, para saber cuánto
  sacar del cajero.

Cómo trabajan hoy: cada mes copian la pestaña del mes anterior, ajustan el presupuesto, borran lo
pagado y agregan filas cuando aparece un gasto nuevo. Agregar filas a veces rompe las fórmulas:
en Oct y Nov 2026 los totales por tipo y por forma de pago dejan afuera las filas 57 a 61.

## Problemas de la hoja actual que este diseño debe hacer imposibles

Medidos sobre "Presupuesto Morchis 2026" (Ene a Nov):

1. El "PAGADO" del resumen muestra el presupuesto: el rango `PagadoGasto` apunta a la columna K.
2. Dos "restantes" con el mismo nombre (ingreso − presupuesto e ingreso − pagado). En Sep el
   presupuesto superó al ingreso por 197.000 y el resumen mostraba +4.534.000.
3. Los rangos fijos no incluyen las filas agregadas al final.
4. Los desgloses laterales no están conectados con su renglón (Suscripciones presupuesta 200.000
   y su desglose suma 146.000).
5. 12 rangos con nombre que apuntan a `#REF!`.
6. No se distingue pendiente de pago parcial ni de mes sin cerrar (Abr: 2,8 M reales de 20,2 M).

## Objetivos

- **H1. Hoja del año.** Una pestaña "Gastos <año>" con una fila por gasto y dos columnas por mes
  (Presupuestado y Real). Abrir un mes nuevo no requiere ningún paso.
- **H2. El presupuesto se copia solo.** El presupuestado de cada mes propone el del mes anterior; se
  escribe encima solo lo que cambia, y desde ahí los meses siguientes toman el valor nuevo.
- **H3. Grupos como dato.** Cada fila lleva su Grupo en una columna con lista desplegable. Agregar
  una categoría es: escribirla en Configuración y elegirla en las filas nuevas.
- **H4. Partes de un gasto.** Una fila puede ser parte de otra (columna "Parte de"). El gasto con
  partes suma solo su presupuestado y su real; no se escribe en él. Cada parte lleva su persona y su
  forma de pago. Reemplaza los desgloses laterales y los renglones duplicados "Mercado Efectivo" y
  "Mercado Digital".
- **H5. Filas en cualquier lugar.** Insertar, mover o borrar filas en cualquier parte de la hoja no
  rompe ningún total.
- **H6. Estado calculado, siempre con texto.** Por fila y mes:
  - real vacío: Pendiente;
  - real menor que lo presupuestado: Pago parcial (gasto fijo) o En ritmo / Va rápido (gasto
    variable, comparando el % gastado con el % del mes transcurrido);
  - real igual: Pagado;
  - real mayor: Excedido.
  La diferencia se muestra en palabras ("quedan 520.000", "se pasó 60.000").
- **H7. Efectivo por persona.** El panel muestra, para el mes elegido y una forma de pago elegible
  (por defecto Efectivo): presupuestado, gastado y falta, por persona y en total. El presupuestado
  total es lo que hay que sacar del cajero.
- **H8. Ingresos con la misma estructura.** Pestaña "Ingresos <año>": una fila por fuente (persona,
  moneda) y Presupuestado y Real por mes.
- **H9. Dos tasas por mes para la segunda moneda.**
  - Tasa para planear: una fila de la hoja de ingresos, que se copia del mes anterior como el
    presupuesto. Ustedes la bajan a propósito cuando quieren margen.
  - Tasa real: sale de una tabla de **cambios** (fecha, dólares, tasa) que escriben a mano el día
    que cambian. La tasa real del mes es el promedio ponderado de los cambios de ese mes. Lo
    habitual es un cambio por mes, pero puede haber varios.
  - El real en pesos es lo ya cambiado más lo que falta por cambiar multiplicado por la tasa para
    planear.
  - El panel muestra "faltan USD X por cambiar" y "tasa real pendiente" mientras corresponda, y
    también la diferencia entre lo planeado y lo que llegó ("+1.360.000 por la tasa").
- **H10. Panel del mes.** Selector de mes y nombre de la familia en la cabecera, con la barra del
  día del mes. Muestra:
  - ingresos, gastado hasta hoy y lo que queda del presupuesto;
  - lo presupuestado y lo sin asignar (que se marca "sobre-asignado" cuando es negativo);
  - la tabla por grupo con presupuestado, real, diferencia, barra de avance y estado;
  - el recuadro de efectivo (H7) y el de ingresos (H9);
  - el reparto E/A/I/N contra sus metas, el resumen por persona y el gráfico del año
    (presupuestado contra real por mes).
- **H11. Todo personalizable en Configuración, sin tocar fórmulas.**
  - **General:** nombre del panel, año, mes de inicio, moneda principal (símbolo y decimales) y
    segunda moneda.
  - **Listas:** personas (con color), formas de pago, tipos de gasto (letra, nombre, meta en %) y
    grupos (con orden). Cada elemento con activo/inactivo: inactivo sale de las listas y conserva
    lo registrado.
  - **Comportamiento:** si el presupuesto se copia al mes siguiente; tolerancia de "va rápido".
- **H12. Identidad visual.** Paleta Juan Basic y bocetos aprobados el 2026-11-22
  (`.superpowers/brainstorm/99412-1795393924/content/opcion-b.html` y `categoria-y-tasa.html`,
  locales, no versionados).

## No objetivos

- Gastos hormiga y registro de cada compra por separado (descartado por Juan el 2026-11-22).
- Pestaña Compras con tarjeta. El pago de la tarjeta es un gasto más; se puede crear una forma de
  pago "Tarjeta X" para ver su total en el recuadro de H7.
- Tasa de cambio automática (`GOOGLEFINANCE`): la tasa real la escribe el usuario.
- Varios años en una misma planilla: un archivo por año, como hoy.
- Formulario de Google para cargar.

## Anti-objetivos

- Que abrir un mes nuevo exija copiar, pegar o borrar algo.
- Que insertar una fila deje un total sin contarla.
- Que un total y la suma de sus partes puedan diferir.
- Que el panel muestre un número con un nombre que no le corresponde.
- Que el comprador tenga que tocar una fórmula para adaptarla a su familia.
- Que la copia vendida muestre una advertencia de Google (sin Apps Script en la copia).

## Restricciones

Las del diseño del 2026-11-13: Google Sheets en el Drive del comprador, web y app móvil (iOS y
Android), funciones probadas en la app (`LET`, `LAMBDA`+`MAP`, `BYROW`, `QUERY`, `XLOOKUP`, `FILTER`,
`SPARKLINE` de barra, formato condicional por texto), construcción en `en_US` y entrega en `es_CO`,
datos reales solo en `data/raw/` y en el Drive de la familia.

## Enfoques considerados

- **A. Pestaña por mes, sin que se rompa** (tablas nativas que se estiran). Mantiene lo conocido,
  pero el mes nuevo sigue siendo manual y no hay vista del año.
- **B. Hoja del año: renglones en filas, meses en columnas.** Elegido por Juan. Es el único en que
  abrir un mes nuevo desaparece, elimina por diseño las filas que rompen fórmulas y conserva el
  modelo de un monto por renglón. Costo: la hoja es ancha y en el celular hay que deslizar hasta el
  mes.
- **C. Una fila por pago** (diseño del 2026-11-13). Flexible, pero para quien escribe un monto por
  renglón es más lento: unas 40 filas por mes eligiendo categoría.

## Decidido en la conversación

- Opción B; sin gastos hormiga.
- Los desgloses (Mercado por tienda, Suscripciones, Servicios) se mantienen como reparto del
  presupuesto con su real; Vicky los usa en su agenda. Servicios públicos usa el mismo mecanismo de
  partes.
- Forma de pago y persona por parte; el efectivo total y por persona sin sumas aparte.
- Agregar una categoría: Configuración y luego la lista desplegable en cada fila.
- Dos tasas por mes; la real es manual, por cambio, con varios cambios posibles en el mes.

## Llamadas mías, a revisar

- **Copiar el presupuesto.** Cada celda de Presupuestado de un mes trae una fórmula que toma el mes
  anterior. Al escribir encima queda el valor. Si alguien borra un valor escrito, la celda queda
  vacía (no vuelve la fórmula); se cuenta como 0 y en el video se muestra cómo recuperarla
  (copiar la celda de al lado). El primer mes del año no tiene anterior: se escribe.
- **Partes de un solo nivel.** Una parte no puede tener partes. Hereda el grupo, el tipo y el
  comportamiento del gasto al que pertenece; lleva su propia persona y forma de pago.
- **Cifras del panel.**
  - Queda del presupuesto: presupuestado menos real.
  - Sin asignar: ingresos presupuestados menos gastos presupuestados.
  - Reparto E/A/I/N: real de cada tipo dividido por los ingresos reales del mes.
  - Por persona: ingresos reales, gastos presupuestados a su nombre y la diferencia.
- **Cambios de moneda por mes del ingreso.** La tabla de cambios lleva Mes (lista), Fecha
  (opcional), dólares y tasa. El mes se elige a mano porque el sueldo de un mes puede cambiarse a
  comienzos del siguiente.
- **Gasto fijo o variable.** Una columna "Comportamiento" (fijo por defecto) decide si el estado es
  Pendiente / Pago parcial / Pagado o En ritmo / Va rápido (H6).
- **Celdas protegidas.** Las filas con partes y los totales llevan protección de solo advertencia,
  que se copia con la planilla y no bloquea al dueño.
- **Tasa para planear en la hoja de ingresos**, como una fila más (no en Configuración, como mostraba
  el boceto), para que se copie de mes a mes igual que el presupuesto.
- **Año nuevo.** Hacer una copia de la plantilla vacía del año, pegar las columnas fijas de los
  gastos y el presupuesto de diciembre en enero. Se explica en la guía; no se automatiza.
- **Tema de color.** Hasta tres paletas a elegir en Configuración, solo si con el formato
  condicional no se vuelve frágil; si lo es, se queda la paleta Juan Basic y se elimina la opción.

## Lo que se conserva del código actual

Generador con `clasp` y pruebas en `node:test`; `config.js` (versión, paleta, configuración
regional), la pestaña Configuración y `_Listas`, `generar.js` y el patrón oráculo + `verificar.js`
(el panel generado se compara a la unidad contra un cálculo independiente en JavaScript). Cambian
las pestañas de datos (`hojas/datos.js`), el oráculo y las fórmulas del panel; salen Hormiga y
Compras con tarjeta.

## Pruebas en el celular (antes de cerrar la fase)

- Escribir lo real de un gasto del mes en curso desde la app de Sheets en iOS y Android: tiempo
  por carga no mayor que en la hoja actual. Columnas a congelar para que se entienda la fila al
  desplazarse.
- Elegir Grupo y "Parte de" desde la lista desplegable en la app.

## Migración de la copia familiar

El historial de Ene a Nov 2026 pasa directo: el presupuestado y el pagado de cada renglón y mes
van a sus columnas. La tabla de equivalencias (renglones viejos a gasto, grupo y parte) se arma con
Juan; los meses sin cerrar (Abr) se migran tal como están.

## Lo que queda para quien construye

Orden exacto de las columnas fijas, cuántas congelar, nombres de rangos, fórmulas concretas,
colores del formato condicional dentro de la paleta, textos de ayuda, ubicación de la tabla de
cambios dentro de la hoja de ingresos y diseño de la pestaña Inicio.

## Criterios de éxito

- La familia usa la hoja anual en diciembre de 2026 y abre enero de 2027 sin copiar pestañas.
- Insertar filas en cualquier lugar no cambia ningún total incorrectamente (prueba del generador).
- El panel de un mes coincide a la unidad con el oráculo sobre los mismos datos.
- El recuadro de efectivo de Nov 2026 migrado da 1.140.000 (Juanchis 1.040.000, Vicky 100.000).
- Una copia desde una cuenta ajena funciona sin pasos técnicos y sin advertencias.
