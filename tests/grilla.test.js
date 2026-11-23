const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'hojas/grilla.js');
const { letra, columnaMes, formulaEncabezadoMes } = vm.runInContext('({ letra, columnaMes, formulaEncabezadoMes })', ctx);

test('letra de columna', () => {
  assert.deepEqual([1, 26, 27, 31, 52, 53].map(letra), ['A', 'Z', 'AA', 'AE', 'AZ', 'BA']);
});

test('columnas de un mes', () => {
  assert.equal(columnaMes(8, 0, 'presupuesto'), 8);
  assert.equal(columnaMes(8, 0, 'real'), 9);
  assert.equal(columnaMes(8, 11, 'real'), 31);
  assert.equal(columnaMes(4, 2, 'presupuesto'), 8);
});

test('encabezado de mes depende de la Configuración', () => {
  assert.equal(formulaEncabezadoMes(0), '=DATE(CfgAno,CfgMesInicio+0,1)');
  assert.equal(formulaEncabezadoMes(11), '=DATE(CfgAno,CfgMesInicio+11,1)');
});
