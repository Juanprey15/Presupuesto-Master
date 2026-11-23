const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./cargar');

/** Doble de SpreadsheetApp: todo método es encadenable; registra fórmulas y configuración regional. */
function falsoSpreadsheetApp() {
  const registro = { locale: 'es_ES', formulasPorLocale: [], localesFijados: [], zona: null };
  const numericos = { getMaxRows: 1000, getMaxColumns: 26, getLastRow: 1, getLastColumn: 1 };
  const objeto = new Proxy(function () {}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop in numericos) return () => numericos[prop];
      if (prop === 'getSheets') return () => [objeto];
      if (prop === 'getUrl') return () => 'https://ejemplo';
      if (prop === 'setFormula') return (f) => { registro.formulasPorLocale.push(registro.locale); return objeto; };
      if (prop === 'setSpreadsheetTimeZone') return (z) => { registro.zona = z; return objeto; };
      if (prop === 'setSpreadsheetLocale') return (l) => { registro.locale = l; registro.localesFijados.push(l); return objeto; };
      return () => objeto;
    },
    apply: () => objeto,
  });
  return { SpreadsheetApp: objeto, registro };
}

function generarCon(opciones) {
  const ctx = cargar('config.js', 'ejemplo.js', 'hojas/configuracion.js', 'hojas/listas.js', 'hojas/datos.js', 'oraculo.js', 'hojas/panel.js', 'generar.js');
  const { SpreadsheetApp, registro } = falsoSpreadsheetApp();
  ctx.SpreadsheetApp = SpreadsheetApp;
  ctx.generarPlantilla(opciones);
  return { ctx, registro };
}

test.skip('las fórmulas se escriben con la configuración regional en_US', () => {
  const { registro } = generarCon({ conEjemplo: true });
  assert.ok(registro.formulasPorLocale.length > 0);
  assert.deepStrictEqual([...new Set(registro.formulasPorLocale)], ['en_US']);
});

test.skip('la planilla queda con la configuración regional del producto', () => {
  const { ctx, registro } = generarCon();
  assert.strictEqual(require('node:vm').runInContext('CONFIG.LOCALE', ctx), 'es_CO');
  assert.strictEqual(registro.locale, 'es_CO');
});

test.skip('la planilla queda en la zona horaria del producto', () => {
  const { registro } = generarCon();
  assert.strictEqual(registro.zona, 'America/Bogota');
});
