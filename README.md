# Presupuesto Master

![Google Sheets](https://img.shields.io/badge/Google%20Sheets-plantilla-34A853?logo=googlesheets&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Apps%20Script-generador-4285F4?logo=googleappsscript&logoColor=white)
![clasp](https://img.shields.io/badge/clasp-3.4.1-5F6368?logo=google&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-26-339933?logo=nodedotjs&logoColor=white)

Plantilla de Google Sheets para el presupuesto familiar: movimientos, presupuesto por categoría,
panel del mes y detección de gastos hormiga. La versión 2 se genera con un script versionado en
este repo.

## Índice

- [Stack](#stack)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura](#estructura)

## Stack

- Google Sheets y Google Forms (producto).
- Google Apps Script como generador de la plantilla, subido con `clasp`.

## Requisitos

- Node.js y npm.
- Una cuenta de Google con la API de Apps Script habilitada en
  <https://script.google.com/home/usersettings>.

## Instalación

```bash
npm install
npx clasp login
```

## Uso

```bash
npm test            # pruebas locales (Node)
npx clasp push      # sube src/ al proyecto de Apps Script
npx clasp open-script
```

En el editor de Apps Script se ejecuta `generarPlantilla` (planilla vacía), `generarConEjemplo` (con
datos ficticios) o `verificarPanel` (genera con ejemplo y compara el Panel contra el cálculo de
`src/oraculo.js`). Cada una crea una planilla nueva en el Drive y registra su URL. La planilla generada
no contiene código.

La planilla tiene una hoja por año con los meses en columnas:

| Pestaña | Qué tiene |
|---|---|
| Inicio | Nombre, versión y cómo se usa |
| Panel | Resumen del mes elegido: presupuestado contra real, efectivo por persona, ingresos y tasa, año |
| Gastos | Una fila por gasto (o parte de un gasto) y Presup. / Real por mes; el presupuesto se copia solo |
| Ingresos | Fuentes de ingreso por mes; con la segunda moneda activada en Configuración, tasa para planear y tabla de cambios |
| Configuración | Nombre, año, monedas, personas, formas de pago, tipos con metas y grupos |

## Estructura

| Carpeta | Contenido |
|---|---|
| `src/` | Generador en Apps Script (se sube con `clasp`) |
| `tests/` | Pruebas en Node |
| `docs/adr/` | Decisiones de arquitectura |
| `data/raw/` | Datos de origen locales (no se versionan) |
