const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js');
const { CONFIG, EJEMPLO } = vm.runInContext('({ CONFIG, EJEMPLO })', ctx);
const plano = (x) => JSON.parse(JSON.stringify(x));

test('configuración del ejemplo', () => {
  const c = plano(EJEMPLO.config);
  assert.deepEqual(c.general, { nombre: 'Familia Prueba', ano: 2026, mesInicio: 1, moneda: 'COP', segundaMoneda: 'USD', copiar: true, tolerancia: 0.1, usarSegunda: true });
  assert.deepEqual(c.personas.map((p) => [p.nombre, p.activa]), [['Ana', true], ['Luis', true], ['Sol', false]]);
  assert.deepEqual(c.formasPago.map((p) => [p.nombre, p.activa]), [['Efectivo', true], ['Digital', true], ['Tarjeta Azul', false]]);
  assert.deepEqual(c.grupos.map((g) => [g.nombre, g.orden, g.activo]), [['Casa', 1, true], ['Sol', 2, true], ['Diversión', 3, true], ['Ahorro', 4, true]]);
  assert.deepEqual(c.tipos.map((t) => [t.letra, t.nombre, t.meta]),
    [['E', 'Esenciales', 0.5], ['A', 'Ahorro', 0.2], ['I', 'Inversión', 0.1], ['N', 'No esenciales', 0.2]]);
});

test('gastos del ejemplo', () => {
  const GASTOS = [
    ['Arriendo', 'Casa', '', 'E', 'fijo', 'Ana', 'Digital', [[1500000, 1500000], [null, 1500000], [1600000, null]]],
    ['Mercado', 'Casa', '', 'E', 'variable', '', '', [[null, 900000], [null, 1100000], [null, 300000]]],
    ['Carnes', 'Casa', 'Mercado', '', '', 'Ana', 'Digital', [[500000, null]]],
    ['Frutas', 'Casa', 'Mercado', '', '', 'Luis', 'Efectivo', [[300000, null]]],
    ['Aseo', 'Casa', 'Mercado', '', '', 'Ana', 'Digital', [[200000, null], [250000, null]]],
    ['Colegio Sol', 'Sol', '', 'E', 'fijo', 'Luis', 'Digital', [[800000, 800000], [null, 400000]]],
    ['Salidas', 'Diversión', '', 'N', 'variable', 'Luis', 'Efectivo', [[300000, 250000], [null, null], [null, 200000]]],
    ['Ahorro', 'Ahorro', '', 'A', 'fijo', 'Ana', 'Digital', [[400000, 400000], [null, 400000]]],
    ['Gimnasio', 'Inexistente', '', 'N', 'fijo', 'Luis', 'Digital', [['abc', 100000]]],
    ['Propinas', 'Diversión', 'Restaurantes', 'N', '', 'Luis', 'Efectivo', [[50000, 50000]]],
  ];
  const claves = ['gasto', 'grupo', 'parteDe', 'tipo', 'comportamiento', 'persona', 'pago', 'meses'];
  assert.deepEqual(plano(EJEMPLO.gastos), GASTOS.map((g) => Object.fromEntries(claves.map((k, i) => [k, g[i]]))));
});

test('ingresos, tasas y cambios del ejemplo', () => {
  assert.deepEqual(plano(EJEMPLO.ingresos), [
    { fuente: 'Sueldo Luis', persona: 'Luis', moneda: 'USD', meses: [[2000, 2000], [null, 2000]] },
    { fuente: 'Ventas Ana', persona: 'Ana', moneda: 'COP', meses: [[3000000, 2700000], [null, 3200000]] },
  ]);
  assert.deepEqual(plano(EJEMPLO.tasaPlan), [4000, null, 3900]);
  assert.deepEqual(plano(EJEMPLO.cambios), [
    { mes: 0, fecha: '2026-01-30', dolares: 2000, tasa: 4100 },
    { mes: 1, fecha: '2026-02-20', dolares: 1000, tasa: 4200 },
    { mes: 1, fecha: '2026-03-02', dolares: 500, tasa: 4300 },
  ]);
});

test('los gastos (salvo el código calculado) y los ingresos usan las claves de CONFIG.COLUMNAS', () => {
  for (const g of EJEMPLO.gastos) assert.deepEqual(Object.keys(g), [...Object.keys(CONFIG.COLUMNAS.gastos).filter((k) => k !== 'codigo'), 'meses']);
  for (const i of EJEMPLO.ingresos) assert.deepEqual(Object.keys(i), [...Object.keys(CONFIG.COLUMNAS.ingresos), 'meses']);
});
