# Presupuesto Master 2: migración de la copia familiar (Fase B)

Fecha: 2026-11-22. Estado: borrador para aprobación.

## Intención

La familia usa una copia derivada de la versión 1.4 (una pestaña por mes, de enero a noviembre de 2026).
Quieren seguir en la hoja anual de la versión 2 (`docs/specs/2026-11-22-hoja-anual-design.md`) desde
diciembre, con el historial del año cargado para verlo en el Panel y en el gráfico del año.

## Objetivos

- **M1.** Una planilla nueva, generada con el generador de siempre, con la Configuración de la familia, enero
  a noviembre cargados en Gastos e Ingresos, y diciembre en adelante con sus fórmulas de copia.
- **M2.** Los totales de cada mes coinciden con la hoja vieja: presupuestado y pagado de gastos, e ingresos.
  Se comprueba en local antes de subir nada.
- **M3.** Los datos reales nunca quedan en archivos versionados ni en el código de Apps Script más allá de
  la ejecución de la migración.

## Reglas de conversión (decididas por Juan)

1. **Renglón que existe con el mismo nombre en varios meses:** una fila; presupuesto y pagado de cada mes van
   a Presup. y Real.
2. **Renglón que cambia por completo de nombre:** filas separadas, cada una solo en sus meses.
3. **Renglones que son el mismo gasto con otro nombre** (variantes que Juan unifica): una sola fila, según la
   tabla de equivalencias.
4. **Gasto que empezó en un renglón y después se partió en "… Efectivo" y "… Digital":** un gasto con partes
   desde enero, una parte por forma de pago; el valor del renglón único va a la parte de su forma de pago
   (columna F. Pago de la hoja vieja).
5. **Gasto con desglose lateral completo** (el desglose suma lo presupuestado del par Efectivo/Digital): las
   partes son los ítems del desglose, cada uno con su forma de pago. Ítems con el mismo nombre en distinta
   mayúscula o con errores de tipeo se unifican; correcciones puntuales de un mes van en la tabla de
   equivalencias.
6. **Gasto con desglose incompleto:** las partes son los ítems del desglose más una parte "Sin detallar" con
   la diferencia hasta lo presupuestado del renglón. Si el desglose está vacío, las partes son los renglones
   Efectivo y Digital.
7. **Real de un gasto con partes:** la suma del pagado de sus renglones de la hoja vieja.
8. **Meses en que una fila no existe:** Presup. y Real en 0 explícito (no fórmula de copia), para que no se
   copie hacia diciembre.
9. **Grupos:** los títulos de la hoja vieja, con los nombres que fije la tabla de equivalencias (por ejemplo,
   un grupo renombrado). Los renglones sin título claro reciben su grupo de la tabla.
10. **Persona, tipo y forma de pago:** de las columnas de cada renglón; las partes toman su forma de pago del
    desglose.
11. **Gasto con partes por renglón** (renglones distintos que Juan agrupa bajo un gasto, como el colegio y su
    derecho de grado): una parte por renglón, con el nombre que fije la tabla.
12. **Comportamiento:** variable para los gastos que fije la tabla; fijo los demás.
13. **Ingresos:** un valor por fuente y mes en la hoja vieja; se carga como presupuestado y como real. Las
    fuentes en dólares se cargan en dólares; la tasa de cada mes de la hoja vieja es la real (un solo cambio al
    mes): se carga como tasa para planear y como un cambio del mes por el total en dólares a esa tasa.
14. **Segunda moneda activada** en la Configuración de la familia.

## Enfoque (elegido por Juan: A)

Un script local en Node, sin dependencias nuevas, lee el `.xlsx` y la tabla de equivalencias y produce los
datos de la familia con la misma forma que `EJEMPLO`. Una función `generarFamilia` del generador los usa. Para
migrar, el archivo de datos se copia a `src/`, se sube, se ejecuta y se borra de `src/`; la siguiente subida
lo quita de Apps Script.

Descartados: bloques para copiar y pegar (pasos manuales y sin verificación) y escritura directa con la API de
Sheets (requiere credenciales de Google Cloud para una sola ejecución).

## Dónde vive cada cosa

- `.xlsx` de origen, tabla de equivalencias y datos convertidos: `data/raw/` (ignorado por git).
- Script de conversión y su verificación: versionados, sin datos reales; sus pruebas usan una hoja vieja
  ficticia mínima.
- `src/familia.js`: solo durante la migración, ignorado por git.

## Verificación

- En local: por cada mes, presupuestado total, pagado total e ingreso total calculados con el oráculo sobre
  los datos convertidos coinciden con los de la hoja vieja (tolerancia 0). Las diferencias esperadas por
  reglas (por ejemplo, la parte "Sin detallar") no cambian totales, así que no hay excepciones.
- En Sheets: `verificarPanel` sobre la planilla de la familia (mismo verificador, con los datos de la familia).
- Juan revisa el Panel de algunos meses contra su hoja vieja.

## No objetivos

- Migrar la versión 1.4 vendida de otros compradores (otra herramienta, si hace falta, más adelante).
- Corregir el historial: los meses sin cerrar se migran como están.

## Anti-objetivos

- Que un total mensual difiera de la hoja vieja.
- Que un gasto de un mes viejo aparezca presupuestado en diciembre.
- Que datos reales queden en git o en el código de Apps Script después de migrar.
