# 0002. La carga desde el celular se hace en la pestaña Movimientos

Fecha: 2026-11-15. Estado: aceptada.

## Contexto

El objetivo O2 del diseño pide cargar una compra desde el celular en unos 10 segundos. Ninguna oferta
lleva código (ADR 0001) y el comprador recibe la planilla con un enlace de copia (`/copy`), sin
configuración técnica. Había que decidir entre cargar directo en la hoja desde la app de Sheets o con un
Formulario de Google vinculado, y qué funciones de Sheets se pueden usar sin romper la vista en la app.

## Prueba

Planilla desechable generada por script con Movimientos (desplegable de unas 30 subcategorías, Pagó y
Forma de pago), un Formulario vinculado con los mismos campos y una pestaña con una fórmula de cada tipo.
Probada por el autor en iOS y Android entre el 2026-11-14 y el 2026-11-15.

| Aspecto | Resultado |
|---|---|
| Abrir la planilla en la app de Sheets | Menos de 5 s en ambos sistemas |
| Cargar un gasto en Movimientos desde la app | Funciona, menos de 5 s; menos cómodo que el Formulario |
| Cargar un gasto con el Formulario | El camino más cómodo; la respuesta llega a la planilla |
| `LET`, `LAMBDA` + `MAP`, `BYROW`, `QUERY`, `XLOOKUP`, `FILTER`, `SPARKLINE` de barra, formato condicional por texto | Muestran resultado en la computadora y en la app de iOS y Android |
| Copia con `/copy` desde otra cuenta, planilla compartida como lector | La planilla se copia; el Formulario no |
| Igual, con el Formulario compartido como editor para cualquiera con el enlace | El Formulario tampoco se copia |

Los tiempos son estimaciones del autor, no cronometrados por carga.

## Opciones consideradas

- **Formulario vinculado entregado con la planilla.** La mejor carga, pero el Formulario no viaja con la
  copia del comprador (ver la prueba). Descartada.
- **Formulario como segundo enlace, vinculado por el comprador.** Buena carga una vez armado, pero exige
  cuatro o cinco pasos técnicos (copiar, vincular con Hojas, elegir la planilla, renombrar la pestaña), una
  capa de fórmulas que una dos tablas de movimientos y más soporte. Queda como posible mejora futura.
- **Marca de tiempo automática con una fórmula circular y cálculo iterativo.** Sin código, pero la fecha
  puede recalcularse al ordenar o copiar filas; inaceptable para datos de dinero.
- **App sin código (AppSheet, Glide) sobre la planilla.** Cada comprador tendría que crearla y autorizarla.
- **Carga directa en Movimientos, pensada para la app.** Un solo enlace, cero configuración.

## Decisión

La carga desde el celular se hace directo en la pestaña Movimientos desde la app de Sheets, que se diseña
para eso; no hay Formulario.

- Columnas en el orden de uso: Fecha, Monto, Subcategoría, Pagó y Forma de pago (obligatorias), luego
  Moneda (vacía cuenta como la moneda principal), Tienda, Para quién, Nota y Origen.
- Encabezado fijo, columnas obligatorias anchas, desplegables con las listas de Configuración y Fecha con
  validación de fecha para que la app muestre el selector de calendario.
- Inicio explica cómo crear un acceso directo a Movimientos en la pantalla de inicio del celular (Android
  desde la app de Sheets; iOS con la app Atajos).
- Funciones permitidas en las fórmulas de la planilla: las de la tabla de prueba. Cualquier otra se
  prueba en la app antes de usarse.

## Por qué

Es la única opción que llega al comprador con un solo enlace y sin pasos técnicos, que es el freno que el
producto quiere evitar. La carga en la hoja ya tardó menos de 5 segundos en la prueba, dentro de O2, y lo
que el usuario carga es lo mismo que ve, sin tablas paralelas que mantener unidas.

## Consecuencias

- La fecha se elige siempre, aunque la compra sea del momento; una compra de otro día no requiere nada
  extra.
- El orden de columnas de Movimientos cambia (Moneda pasa detrás de Forma de pago) en la tarea de carga;
  las fórmulas no dependen del orden porque leen rangos con nombre.
- Si más adelante se ofrece el Formulario como mejora opcional, hará falta la capa que una sus respuestas
  con Movimientos y una guía en video para vincularlo.
