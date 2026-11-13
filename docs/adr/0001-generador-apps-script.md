# 0001. La plantilla se genera con un script de Apps Script versionado

Fecha: 2026-11-13. Estado: aceptada.

## Contexto

Presupuesto Master 2 es una plantilla de Google Sheets que se vende en varias ofertas (básica,
premium, curso o membresía) y recibe versiones nuevas (2.x) que el comprador adopta copiando sus
pestañas de datos. La básica no puede llevar Apps Script: una planilla copiada con código muestra la
pantalla de "app no verificada" al autorizar. Hace falta poder reconstruir cada versión, revisar qué
cambió entre versiones y publicar las ofertas desde una sola fuente.

## Opciones consideradas

- **A mano en Sheets.** Arranque inmediato, pero sin reproducción ni diferencias revisables; cada
  oferta y cada versión es una copia manual.
- **Generador Apps Script independiente con `clasp`.** El código vive en este repo; al ejecutarse crea
  la planilla desde cero (pestañas, fórmulas, validaciones, formato condicional, rangos con nombre,
  protecciones y el Formulario vinculado vía FormApp). Como el script no está ligado a la planilla, la
  planilla generada no contiene código.
- **Python + API de Sheets.** Lenguaje habitual del autor, pero exige un proyecto de Google Cloud con
  OAuth, los `batchUpdate` son verbosos y la API de Forms no vincula un formulario a una planilla.
- **Generar `.xlsx` e importar.** Pierde funciones propias de Sheets (`GOOGLEFINANCE`, casillas,
  desplegables dependientes). Descartada.
- **A mano + exportador de estructura a texto.** Da diferencias revisables, pero no reconstruye la
  planilla.

## Decisión

Generador en Apps Script, desarrollado localmente y subido con `clasp` (versión fijada en
`package.json`). Cada ejecución produce una planilla nueva de la versión indicada. Ninguna oferta
lleva código: la básica y la premium salen solo con fórmulas (la premium agrega pestañas de
planificación), así que el comprador nunca ve una pantalla de autorización. La única autorización es la
del autor, una vez, para ejecutar el generador.

## Por qué

Es la única opción que cumple a la vez: una sola fuente para todas las ofertas, básica sin código,
versiones reproducibles y revisables en git, y creación del Formulario vinculado. El costo es
escribir el formato con código, que es más tedioso que hacerlo a mano.

## Consecuencias

- La corrección de las fórmulas se prueba con datos de ejemplo ficticios y resultados esperados
  calculados por fuera, comparados contra la planilla generada.
- Requiere `clasp login` con la cuenta de Google del autor; las credenciales quedan en
  `~/.clasprc.json`, fuera del repo.
