const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/grilla.js', 'hojas/gastos.js');
const { CONFIG, EJEMPLO, formulaPresupuestoGasto, disenoGastos, letraGastos, PRIMERA_COLUMNA_GASTOS } =
  vm.runInContext('({ CONFIG, EJEMPLO, formulaPresupuestoGasto, disenoGastos, letraGastos, PRIMERA_COLUMNA_GASTOS })', ctx);
const plano = (x) => JSON.parse(JSON.stringify(x));
const ULTIMA = CONFIG.FILA_DATOS + CONFIG.FILAS_GASTOS - 1;
const celdaDe = (d, fila, columna) => d.celdas.find((c) => c.fila === fila && c.columna === columna);

test('fórmula de presupuesto: partes sin la fila propia, si no copia del mes anterior', () => {
  assert.equal(formulaPresupuestoGasto(5, 'K', 'I'),
    '=IF($A5="","",IF(COUNTIF($D$2:$D4,$A5)+COUNTIF($D6:$D,$A5)>0,SUMIF($D$2:$D4,$A5,K$2:K4)+SUMIF($D6:$D,$A5,K6:K),IF(CfgCopiar,I5,"")))');
  assert.equal(formulaPresupuestoGasto(3, 'I', null),
    '=IF($A3="","",IF(COUNTIF($D$2:$D2,$A3)+COUNTIF($D4:$D,$A3)>0,SUMIF($D$2:$D2,$A3,I$2:I2)+SUMIF($D4:$D,$A3,I4:I),""))');
});

test('encabezados y columnas fijas del ejemplo', () => {
  const d = disenoGastos(EJEMPLO);
  assert.deepEqual(plano(d.encabezados), Object.values(CONFIG.COLUMNAS.gastos));
  assert.equal(d.filas.length, CONFIG.FILAS_GASTOS);
  assert.deepEqual(plano(d.filas[0]), ['Arriendo', '', 'Casa', '', 'E', 'fijo', 'Ana', 'Digital']);
  assert.deepEqual(plano(d.filas[2]), ['Carnes', '', 'Casa', 'Mercado', '', '', 'Ana', 'Digital']);
  assert.deepEqual(plano(d.filas[CONFIG.FILAS_GASTOS - 1]), ['', '', '', '', '', '', '', '']);
});

test('Arriendo: valores escritos y fórmula de copia', () => {
  const d = disenoGastos(EJEMPLO);
  assert.equal(celdaDe(d, 3, 9).valor, 1500000);
  assert.equal(celdaDe(d, 3, 10).valor, 1500000);
  assert.equal(celdaDe(d, 3, 11).formula, formulaPresupuestoGasto(3, 'K', 'I'));
  assert.equal(celdaDe(d, 3, 12).valor, 1500000);
  assert.equal(celdaDe(d, 3, 13).valor, 1600000);
  assert.equal(celdaDe(d, 3, 14), undefined);
});

test('el real de una parte queda vacío', () => {
  const d = disenoGastos(EJEMPLO);
  for (let i = 0; i < CONFIG.MESES; i++) assert.equal(celdaDe(d, 5, 10 + 2 * i), undefined);
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
  assert.equal(de(2), undefined);
  assert.equal(de(3).lista, 'ListaGrupos');
  assert.equal(de(4).lista, 'ListaGastosPadre');
  assert.equal(de(5).lista, 'ListaTipos');
  assert.deepEqual(de(6).valores, ['fijo', 'variable']);
  assert.equal(de(7).lista, 'ListaPersonas');
  assert.equal(de(8).lista, 'ListaFormasPago');
  assert.deepEqual(de(1), { columna: 1, formula: '=COUNTIFS($A$3:$A,$A3,$D$3:$D,"")<=1', soloAviso: true });
});

test('el real de una parte huérfana (Propinas) se escribe: cuenta como gasto propio', () => {
  assert.equal(celdaDe(disenoGastos(EJEMPLO), 12, 10).valor, 50000);
});

test('las letras de Gastos salen del orden de sus columnas', () => {
  assert.deepEqual(['gasto', 'codigo', 'grupo', 'parteDe', 'pago'].map(letraGastos), ['A', 'B', 'C', 'D', 'H']);
  assert.equal(PRIMERA_COLUMNA_GASTOS, 9);
});
