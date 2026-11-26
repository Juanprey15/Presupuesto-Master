# Forma de pago visible en Gastos

Fecha: 2026-11-24. Estado: aprobado por Juan (diseño corto).

## Intención

En la pestaña Gastos solo queda fija la columna del gasto. En los últimos meses del año la forma de pago
(columna G, a más de 20 columnas del mes) queda fuera de la pantalla, sobre todo en el celular, y cuesta
saber qué se paga en efectivo y qué en digital.

## Objetivos

- Ver la forma de pago de cada fila en cualquier mes, en el celular y en la computadora.
- Que ocupe el mínimo ancho en el celular.
- Que cada comprador ajuste códigos y colores desde Configuración, con valores por defecto que no exigen
  llenar nada.

## No objetivos

- Cambiar la forma de pago por mes (sigue siendo una por fila; un gasto que cambia de forma de pago usa
  partes Efectivo/Digital).
- Colores libres (cualquier tono): la planilla no lleva código y una regla de formato condicional tiene un
  color fijo.
- Cambios en los cálculos del Panel.

## Enfoques considerados

| Enfoque | Por qué no / por qué sí |
|---|---|
| Fijar la columna Forma de pago completa | Ocupa casi un tercio de la pantalla del iPhone. |
| Solo color en los meses | No sirve a quien distingue mal los colores; con muchas formas de pago se confunde. |
| Agrupar y plegar los meses pasados | Hay que plegar a mano cada mes; comportamiento en la app no probado. |
| **Código angosto fijo + meses teñidos (elegido)** | Texto que se lee sin color, el color da la lectura rápida, ocupa ~30 px. |

## Diseño

1. **Columna B "Pago" en Gastos.** Nueva, de ~30 px, fija junto con A (dos columnas fijas). Una sola
   fórmula en B3 que se derrama hacia abajo (`MAP` sobre el rango abierto), así cubre las filas agregadas.
   Muestra el código de la forma de pago de la fila; vacío si la fila no tiene forma de pago (gasto padre).
   Si el código está vacío en Configuración, usa la primera letra de la forma de pago. Las demás columnas se
   corren una a la derecha: la forma de pago pasa a la H con el encabezado "Forma de pago" y los meses
   empiezan en la I.
2. **Configuración, tabla Formas de pago:** columnas nuevas **Código** y **Color**.
   - Código: por defecto la primera letra; editable (por ejemplo "TC").
   - Color: desplegable con la paleta de pago: Musgo, Pizarra, Arena, Malva, Cielo, Durazno, Salvia, Gris y
     "Sin color". Por defecto, la forma de pago k toma el tono k de la paleta (Efectivo Musgo, Digital
     Pizarra); de la novena en adelante, "Sin color".
   - Los datos que no traen código ni color (planillas migradas, ejemplo) reciben esos mismos defectos.
3. **Colores.** Una regla de formato condicional por tono, sobre la columna B y las columnas de los 12
   meses, después de las reglas existentes (gris del Real de las partes y negrita del gasto padre), para que
   esas sigan mandando. La regla busca la forma de pago de la fila en Configuración por rango con nombre a
   través de `INDIRECT`, para no depender de la posición de las columnas de Configuración. Los tonos son
   suaves: el texto (`ink`) sobre cualquiera de ellos pasa AA.
4. **Referencias a columnas de Gastos.** Las letras que hoy están escritas a mano (Panel, `_Listas`,
   fórmulas y reglas de Gastos) se derivan del orden de `CONFIG.COLUMNAS.gastos`, para que insertar la
   columna no deje referencias corridas.

## Verificación

- Pruebas automáticas: diseño de Gastos (columna B, meses desde la I, validaciones), Configuración
  (Código y Color con defectos), reglas de color y referencias del Panel y `_Listas`.
- En Sheets: `verificarPanel` da OK; luego `verificarFamilia` con los datos de la familia y revisión en el
  iPhone (colores, código y cambio de color desde Configuración).

## Probado antes del diseño (2026-11-23, planilla de la familia)

Formato condicional con `XLOOKUP` e `INDIRECT` hacia Configuración: se ve en la app de iPhone y el color
cambia en el acto al editar Configuración desde el teléfono. Pendiente: la misma regla con `INDIRECT` de un
rango con nombre; si la app o Sheets no la aceptan, se usa la referencia de hoja calculada al generar.
