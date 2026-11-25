const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/grilla.js', 'hojas/ingresos.js');
const { CONFIG, EJEMPLO, disenoIngresos } = vm.runInContext('({ CONFIG, EJEMPLO, disenoIngresos })', ctx);
const celdaDe = (d, a1) => {
  const [, col, fila] = a1.match(/^([A-Z]+)(\d+)$/);
  const n = [...col].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);
  return d.celdas.find((c) => c.fila === Number(fila) && c.columna === n);
};

test('fila de la tasa para planear: escrita o copiada del mes anterior', () => {
  const d = disenoIngresos(EJEMPLO);
  assert.deepEqual([...d.filas[0]], ['=IF(CfgUsarSegunda,"Tasa para planear","")', '', '=IF(CfgUsarSegunda,CfgSegundaMoneda,"")']);
  assert.equal(celdaDe(d, 'D3').valor, 4000);
  assert.equal(celdaDe(d, 'F3').formula, '=IF(D3="","",D3)');
  assert.equal(celdaDe(d, 'H3').valor, 3900);
  assert.match(celdaDe(d, 'E3').formula, /^=IFERROR\(SUMIFS\(\$AG\$3:\$AG,\$AC\$3:\$AC,">="&DATE\(CfgAno,CfgMesInicio\+0,1\)/);
});

test('fuentes: valores escritos y copia del presupuesto', () => {
  const d = disenoIngresos(EJEMPLO);
  assert.equal(d.filas.length, 1 + CONFIG.FILAS_INGRESOS);
  assert.deepEqual([...d.filas[1]], ['Sueldo Luis', 'Luis', 'USD']);
  assert.equal(celdaDe(d, 'D4').valor, 2000);
  assert.equal(celdaDe(d, 'E4').valor, 2000);
  assert.equal(celdaDe(d, 'F4').formula, '=IF(AND($A4<>"",CfgCopiar),D4,"")');
  assert.equal(celdaDe(d, 'G4').valor, 2000);
  assert.equal(celdaDe(d, 'D6'), undefined);
});

test('tabla de cambios desde la columna AC', () => {
  const { cambios } = disenoIngresos(EJEMPLO);
  assert.equal(cambios.columna, 29);
  assert.deepEqual([...cambios.encabezados], Object.values(CONFIG.COLUMNAS.cambios));
  assert.deepEqual(JSON.parse(JSON.stringify(cambios.filas.map((f) => [f[0].getMonth(), f[2], f[3]]))), [[0, 2000, 4100], [1, 1000, 4200], [1, 500, 4300]]);
  assert.equal(cambios.filas[2][1].getDate(), 2);
  assert.equal(cambios.formulaPesos(3), '=IF(AND(ISNUMBER(AE3),ISNUMBER(AF3)),AE3*AF3,"")');
});

test('validaciones de Ingresos', () => {
  const v = disenoIngresos().validaciones;
  assert.equal(v.find((x) => x.columna === 2).lista, 'ListaPersonas');
  assert.equal(v.find((x) => x.columna === 3).lista, 'ListaMonedas');
});

test('la tasa real de Ingresos cuenta cambios de cualquier día del mes', () => {
  const f = disenoIngresos(EJEMPLO).celdas.find((c) => c.fila === 3 && c.columna === 5).formula;
  assert.match(f, /SUMIFS\(/);
  assert.match(f, /">="&DATE\(CfgAno,CfgMesInicio\+0,1\)/);
});

test('la fila de tasa y la tabla de cambios solo se ven con segunda moneda', () => {
  const d = disenoIngresos(EJEMPLO);
  assert.equal(d.filas[0][0], '=IF(CfgUsarSegunda,"Tasa para planear","")');
  assert.equal(d.cambios.formulasEncabezado[0], '=IF(CfgUsarSegunda,"Mes del ingreso","")');
});

test('un cambio sin fecha deja la celda de fecha vacía', () => {
  const d = disenoIngresos({ ...EJEMPLO, cambios: [{ mes: 0, fecha: '', dolares: 100, tasa: 4000 }] });
  assert.equal(d.cambios.filas[0][1], '');
});
