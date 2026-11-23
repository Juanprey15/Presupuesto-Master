const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ARCHIVOS = ['config.js', 'ejemplo.js', 'oraculo.js', 'hojas/grilla.js', 'hojas/configuracion.js', 'hojas/listas.js',
  'hojas/gastos.js', 'hojas/ingresos.js', 'hojas/panel.js', 'hojas/inicio.js', 'generar.js'];

/** Doble de SpreadsheetApp: todo método es encadenable; registra fórmulas, pestañas y configuración regional. */
function falsoSpreadsheetApp() {
  const registro = { locale: 'es_ES', formulasPorLocale: [], localesFijados: [], zona: null, hojas: [], ocultadas: 0 };
  const numericos = { getMaxRows: 1000, getMaxColumns: 26, getLastRow: 1, getLastColumn: 1, getRow: 1, getColumn: 1 };
  const objeto = new Proxy(function () {}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop in numericos) return () => numericos[prop];
      if (prop === 'getSheets') return () => [objeto];
      if (prop === 'getUrl') return () => 'https://ejemplo';
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
  ctx.Charts = { ChartType: { COLUMN: 'COLUMN' } };
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
