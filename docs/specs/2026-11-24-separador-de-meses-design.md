# Separador de meses en Gastos e Ingresos

Fecha: 2026-11-24. Estado: aprobado por Juan (diseño corto, probado a mano en la planilla de la familia).

## Intención

Las grillas de Gastos e Ingresos muestran 24 columnas de meses seguidas y se leen como un solo bloque de
números. Hace falta ver dónde empieza cada mes sin depender del encabezado.

## Enfoques considerados

| Enfoque | Por qué no / por qué sí |
|---|---|
| Fondo alternado por mes | En Gastos el color de la forma de pago lo tapa. |
| Columna vacía entre meses | Corre las posiciones que leen el Panel, `_Listas` y la migración; quita ancho en el celular. |
| Encabezados alternados | No ayuda al bajar por la tabla. |
| **Línea gruesa a la izquierda de cada mes (elegido)** | El formato condicional no toca bordes; no mueve columnas. |

## Diseño

- Borde izquierdo grueso (`SOLID_THICK`) en la columna Presup. de cada mes, en toda la altura de la hoja,
  encabezados incluidos.
- Gastos: blanco (`surface`), que se lee como un hueco entre las celdas teñidas.
- Ingresos: pizarra (`primary`), porque sus celdas son blancas y una línea blanca no se vería.

## Verificación

- Prueba automática: el generador pone 12 separadores blancos y 12 pizarra, todos gruesos.
- En Sheets: `verificarPanel` OK y revisión visual en la computadora y el iPhone.
