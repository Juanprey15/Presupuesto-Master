const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/grilla.js', 'hojas/gastos.js');
const { CONFIG, EJEMPLO, formulaPresupuestoGasto, disenoGastos } =
  vm.runInContext('({ CONFIG, EJEMPLO, formulaPresupuestoGasto, disenoGastos })', ctx);
const plano = (x) => JSON.parse(JSON.stringify(x));
const ULTIMA = CONFIG.FILA_DATOS + CONFIG.FILAS_GASTOS - 1;
const celdaDe = (d, fila, columna) => d.celdas.find((c) => c.fila === fila && c.columna === columna);

test('fórmula de presupuesto: partes sin la fila propia, si no copia del mes anterior', () => {
  assert.equal(formulaPresupuestoGasto(5, 'J', 'H'),
    '=IF($A5="","",IF(COUNTIF($C$2:$C4,$A5)+COUNTIF($C6:$C,$A5)>0,SUMIF($C$2:$C4,$A5,J$2:J4)+SUMIF($C6:$C,$A5,J6:J),IF(CfgCopiar,H5,"")))');
  assert.equal(formulaPresupuestoGasto(3, 'H', null),
    '=IF($A3="","",IF(COUNTIF($C$2:$C2,$A3)+COUNTIF($C4:$C,$A3)>0,SUMIF($C$2:$C2,$A3,H$2:H2)+SUMIF($C4:$C,$A3,H4:H),""))');
});

test('encabezados y columnas fijas del ejemplo', () => {
  const d = disenoGastos(EJEMPLO);
  assert.deepEqual(plano(d.encabezados), Object.values(CONFIG.COLUMNAS.gastos));
  assert.equal(d.filas.length, CONFIG.FILAS_GASTOS);
  assert.deepEqual(plano(d.filas[0]), ['Arriendo', 'Casa', '', 'E', 'fijo', 'Ana', 'Digital']);
  assert.deepEqual(plano(d.filas[2]), ['Carnes', 'Casa', 'Mercado', '', '', 'Ana', 'Digital']);
  assert.deepEqual(plano(d.filas[CONFIG.FILAS_GASTOS - 1]), ['', '', '', '', '', '', '']);
});

test('Arriendo: valores escritos y fórmula de copia', () => {
  const d = disenoGastos(EJEMPLO);
  assert.equal(celdaDe(d, 3, 8).valor, 1500000);
  assert.equal(celdaDe(d, 3, 9).valor, 1500000);
  assert.equal(celdaDe(d, 3, 10).formula, formulaPresupuestoGasto(3, 'J', 'H'));
  assert.equal(celdaDe(d, 3, 11).valor, 1500000);
  assert.equal(celdaDe(d, 3, 12).valor, 1600000);
  assert.equal(celdaDe(d, 3, 13), undefined);
});

test('el real de una parte queda vacío', () => {
  const d = disenoGastos(EJEMPLO);
  for (let i = 0; i < CONFIG.MESES; i++) assert.equal(celdaDe(d, 5, 9 + 2 * i), undefined);
});

test('todas las filas preparadas traen fórmula de presupuesto en cada mes', () => {
  const d = disenoGastos(EJEMPLO);
  const enUltima = d.celdas.filter((c) => c.fila === ULTIMA && c.formula);
  assert.equal(enUltima.length, CONFIG.MESES);
  assert.equal(disenoGastos().celdas.filter((c) => c.formula).length, CONFIG.FILAS_GASTOS * CONFIG.MESES);
});

test('validaciones de las columnas fijas', () => {
  const v = plano(disenoGastos().validaciones);
  const de = (columna) => v.find((x) => x.columna === columna);
  assert.equal(de(2).lista, 'ListaGrupos');
  assert.equal(de(3).lista, 'ListaGastosPadre');
  assert.equal(de(4).lista, 'ListaTipos');
  assert.deepEqual(de(5).valores, ['fijo', 'variable']);
  assert.equal(de(6).lista, 'ListaPersonas');
  assert.equal(de(7).lista, 'ListaFormasPago');
  assert.deepEqual(de(1), { columna: 1, formula: '=COUNTIFS($A$3:$A,$A3,$C$3:$C,"")<=1', soloAviso: true });
});

test('el real de una parte huérfana (Propinas) se escribe: cuenta como gasto propio', () => {
  assert.equal(celdaDe(disenoGastos(EJEMPLO), 12, 9).valor, 50000);
});
