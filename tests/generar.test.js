const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ARCHIVOS = ['config.js', 'ejemplo.js', 'oraculo.js', 'hojas/grilla.js', 'hojas/configuracion.js', 'hojas/listas.js',
  'hojas/gastos.js', 'hojas/ingresos.js', 'hojas/panel.js', 'hojas/inicio.js', 'generar.js'];

/** Doble de SpreadsheetApp: todo método es encadenable; registra fórmulas, pestañas y configuración regional. */
function falsoSpreadsheetApp() {
  const registro = { locale: 'es_ES', formulasPorLocale: [], localesFijados: [], zona: null, hojas: [], ocultadas: 0, columnas: 26, bordes: [] };
  const numericos = { getMaxRows: 1000, getLastRow: 1, getLastColumn: 1, getRow: 1, getColumn: 1 };
  const objeto = new Proxy(function () {}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop in numericos) return () => numericos[prop];
      if (prop === 'getSheets') return () => [objeto];
      if (prop === 'getUrl') return () => 'https://ejemplo';
      if (prop === 'getMaxColumns') return () => registro.columnas;
      if (prop === 'insertColumnsAfter') return (_, n) => { registro.columnas += n; return objeto; };
      if (prop === 'getRange') {
        return (fila, columna, filas, columnas) => {
          // Como Sheets: un intervalo numérico no puede pasar de la última columna de la hoja.
          if (typeof columna === 'number' && columna + (columnas || 1) - 1 > registro.columnas) {
            throw new Error('Las coordenadas del intervalo están fuera de las dimensiones de la hoja.');
          }
          return objeto;
        };
      }
      if (prop === 'BorderStyle') return { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', SOLID_THICK: 'SOLID_THICK' };
      if (prop === 'setBorder') return (...args) => { registro.bordes.push(args); return objeto; };
      if (prop === 'insertSheet') return (nombre) => { registro.hojas.push(nombre); return objeto; };
      if (prop === 'hideSheet') return () => { registro.ocultadas += 1; return objeto; };
      if (prop === 'setFormula') return () => { registro.formulasPorLocale.push(registro.locale); return objeto; };
      if (prop === 'setFormulas') return () => { registro.formulasPorLocale.push(registro.locale); return objeto; };
      if (prop === 'setSpreadsheetTimeZone') return (z) => { registro.zona = z; return objeto; };
      if (prop === 'setSpreadsheetLocale') return (l) => { registro.locale = l; registro.localesFijados.push(l); return objeto; };
      return () => objeto;
    },
    apply: () => objeto,
  });
  return { SpreadsheetApp: objeto, registro };
}

function generarCon(opciones) {
  const ctx = cargar(...ARCHIVOS);
  const { SpreadsheetApp, registro } = falsoSpreadsheetApp();
  ctx.SpreadsheetApp = SpreadsheetApp;
  ctx.Charts = { ChartType: { COLUMN: 'COLUMN' }, ChartHiddenDimensionStrategy: { SHOW_BOTH: 'SHOW_BOTH' } };
  ctx.generarPlantilla(opciones);
  return { ctx, registro };
}

test('las fórmulas se escriben con la configuración regional en_US', () => {
  const { registro } = generarCon({ conEjemplo: true });
  assert.ok(registro.formulasPorLocale.length > 0);
  assert.deepStrictEqual([...new Set(registro.formulasPorLocale)], ['en_US']);
});

test('la planilla queda con la configuración regional y la zona horaria del producto', () => {
  const { ctx, registro } = generarCon();
  assert.strictEqual(vm.runInContext('CONFIG.LOCALE', ctx), 'es_CO');
  assert.strictEqual(registro.locale, 'es_CO');
  assert.strictEqual(registro.zona, 'America/Bogota');
});

test('crea exactamente las pestañas de CONFIG.HOJAS y oculta _Listas', () => {
  const { ctx, registro } = generarCon({ conEjemplo: true });
  assert.deepStrictEqual(registro.hojas, [...Object.values(vm.runInContext('CONFIG.HOJAS', ctx))]);
  assert.strictEqual(registro.ocultadas, 1);
});

test('Inicio muestra el nombre, la versión y cómo se usa', () => {
  const ctx = cargar('config.js', 'hojas/inicio.js');
  const { textos, version } = vm.runInContext('({ textos: disenoInicio(), version: CONFIG.VERSION })', ctx);
  assert.strictEqual(textos[0].formula, '=CfgNombre');
  assert.ok(textos.some((t) => t.valor === `Versión ${version}`));
  for (const frase of ['Escribe lo real en Gastos', 'Un gasto nuevo va en una fila libre', 'El mes se elige en el Panel']) {
    assert.ok(textos.some((t) => t.valor === frase), frase);
  }
});

test('generarPlantilla usa los datos que recibe', () => {
  const ctx = cargar(...ARCHIVOS);
  const { SpreadsheetApp } = falsoSpreadsheetApp();
  ctx.SpreadsheetApp = SpreadsheetApp;
  ctx.Charts = { ChartType: { COLUMN: 'COLUMN' }, ChartHiddenDimensionStrategy: { SHOW_BOTH: 'SHOW_BOTH' } };
  let recibido = null;
  ctx.construirConfiguracion = (ss, datos) => { recibido = datos; };
  const datos = vm.runInContext('EJEMPLO', ctx);
  ctx.generarPlantilla({ datos });
  assert.strictEqual(recibido, datos);
});

test('generarFamilia sin src/familia.js avisa qué falta', () => {
  const ctx = cargar(...ARCHIVOS);
  assert.throws(() => ctx.generarFamilia(), /Falta src\/familia\.js/);
});

test('un separador grueso a la izquierda de cada mes: blanco en Gastos, pizarra en Ingresos', () => {
  const { ctx, registro } = generarCon({ conEjemplo: true });
  const P = vm.runInContext('CONFIG.PALETA', ctx);
  const meses = vm.runInContext('CONFIG.MESES', ctx);
  const separadores = registro.bordes.filter((b) => b[1] === true && b[0] === null && b[2] === null && b[3] === null);
  const color = (hex) => separadores.filter((b) => b[6] === hex).length;
  assert.strictEqual(color(P.surface), meses);
  assert.strictEqual(color(P.primary), meses);
  assert.ok(separadores.every((b) => b[7] === 'SOLID_THICK'));
});
