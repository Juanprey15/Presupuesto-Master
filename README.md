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

## Estructura

| Carpeta | Contenido |
|---|---|
| `docs/adr/` | Decisiones de arquitectura |
| `data/raw/` | Datos de origen locales (no se versionan) |
