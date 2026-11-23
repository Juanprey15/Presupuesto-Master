const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'oraculo.js');
const { EJEMPLO, calcularMes, calcularFormaPago } = vm.runInContext('({ EJEMPLO, calcularMes, calcularFormaPago })', ctx);
const HOY = new Date(2026, 2, 10);
const plano = (x) => JSON.parse(JSON.stringify(x));
const pick = (o, ...k) => Object.fromEntries(k.map((x) => [x, o[x]]));
const fila = (m, gasto) => m.filas.find((f) => f.gasto === gasto);
const conGeneral = (d, g) => ({ ...d, config: { ...d.config, general: { ...d.config.general, ...g } } });

test('enero: totales', () => {
  const m = calcularMes(EJEMPLO, 0, HOY);
  assert.equal(m.presupuestado, 4050000);
  assert.equal(m.gastado, 4000000);
  assert.equal(m.queda, 50000);
  assert.deepEqual(pick(m.ingresos, 'planeado', 'real', 'mostrado', 'tasaPlan', 'tasaReal', 'diferenciaTasa'),
    { planeado: 11000000, real: 10900000, mostrado: 10900000, tasaPlan: 4000, tasaReal: 4100, diferenciaTasa: 200000 });
  assert.equal(m.sinAsignar, 11000000 - 4050000);
});

test('enero: filas en orden y estados', () => {
  assert.deepEqual(plano(calcularMes(EJEMPLO, 0, HOY).filas.map((f) => [f.grupo, f.gasto, f.estado])), [
    ['Casa', 'Arriendo', 'Pagado'], ['Casa', 'Mercado', 'En ritmo'], ['Sol', 'Colegio Sol', 'Pagado'],
    ['Diversión', 'Salidas', 'En ritmo'], ['Diversión', 'Propinas', 'Pagado'], ['Ahorro', 'Ahorro', 'Pagado'],
    ['Sin grupo', 'Gimnasio', 'Excedido']]);
});

test('enero: diferencia y avance por fila', () => {
  const m = calcularMes(EJEMPLO, 0, HOY);
  assert.deepEqual(pick(fila(m, 'Mercado'), 'presupuesto', 'real', 'diferencia', 'avance'),
    { presupuesto: 1000000, real: 900000, diferencia: 100000, avance: 0.9 });
  assert.deepEqual(pick(fila(m, 'Gimnasio'), 'presupuesto', 'real', 'diferencia', 'avance'),
    { presupuesto: 0, real: 100000, diferencia: -100000, avance: 0 });
});

test('febrero: copia, partes y estados', () => {
  const m = calcularMes(EJEMPLO, 1, HOY);
  assert.equal(m.presupuestado, 4100000);
  assert.equal(m.gastado, 3400000);
  assert.deepEqual(plano(Object.fromEntries(m.filas.map((f) => [f.gasto, f.estado]))), {
    Arriendo: 'Pagado', Mercado: 'Excedido', 'Colegio Sol': 'Pago parcial', Salidas: 'Pendiente',
    Propinas: 'Pendiente', Ahorro: 'Pagado' });
  assert.deepEqual(pick(m.ingresos, 'real', 'usdPorCambiar', 'diferenciaTasa'),
    { real: 11550000, usdPorCambiar: 500, diferenciaTasa: 350000 });
  assert.ok(Math.abs(m.ingresos.tasaReal - 6350000 / 1500) < 1e-9);
});

test('marzo en curso: ritmo', () => {
  const m = calcularMes(EJEMPLO, 2, HOY);
  assert.equal(m.presupuestado, 4200000);
  assert.deepEqual(pick(m.ingresos, 'planeado', 'hayReal', 'mostrado', 'tasaReal'),
    { planeado: 10800000, hayReal: false, mostrado: 10800000, tasaReal: null });
  assert.equal(fila(m, 'Salidas').estado, 'Va rápido');
  assert.equal(fila(m, 'Mercado').estado, 'En ritmo');
  assert.equal(fila(m, 'Arriendo').presupuesto, 1600000);
});

test('enero: efectivo por persona', () => {
  assert.deepEqual(plano(calcularFormaPago(EJEMPLO, 0, 'Efectivo')), {
    filas: [{ persona: 'Ana', presupuestado: 0, gastado: 0, falta: 0 },
      { persona: 'Luis', presupuestado: 650000, gastado: 300000, falta: 350000 }],
    total: { presupuestado: 650000, gastado: 300000, falta: 350000 }, sinContar: ['Mercado'] });
});

test('enero: tipos y personas', () => {
  const m = calcularMes(EJEMPLO, 0, HOY);
  assert.deepEqual(plano(m.tipos.map((t) => [t.tipo, t.real])), [['E', 3200000], ['A', 400000], ['I', 0], ['N', 400000]]);
  assert.ok(Math.abs(m.tipos[0].pctIngreso - 3200000 / 10900000) < 1e-12);
  assert.deepEqual(plano(m.personas.map((p) => [p.persona, p.ingresa, p.presupuesta, p.leQueda])),
    [['Ana', 2700000, 2600000, 100000], ['Luis', 8200000, 1450000, 6750000]]);
});

test('sin copiar, el presupuesto no escrito vale 0', () => {
  const d = conGeneral(EJEMPLO, { copiar: false });
  assert.equal(fila(calcularMes(d, 1, HOY), 'Arriendo').presupuesto, 0);
});

test('sin tasa para planear avisa y no inventa', () => {
  const m = calcularMes({ ...EJEMPLO, tasaPlan: [] }, 0, HOY);
  assert.equal(m.ingresos.faltaTasa, true);
  assert.equal(m.ingresos.planeado, 3000000);
  assert.equal(calcularMes(EJEMPLO, 0, HOY).ingresos.faltaTasa, false);
});

test('el año tiene 12 meses y copia el presupuesto hacia adelante', () => {
  const a = plano(calcularMes(EJEMPLO, 0, HOY).ano);
  assert.equal(a.length, 12);
  assert.deepEqual(a[0], { presupuestado: 4050000, real: 4000000 });
  assert.deepEqual(a[11], { presupuestado: 4200000, real: 0 });
});

test('el efectivo de un gasto sin persona va en "Sin persona" y suma en el total', () => {
  const d = { ...EJEMPLO, gastos: [...EJEMPLO.gastos,
    { gasto: 'Mesada', grupo: 'Casa', parteDe: '', tipo: 'N', comportamiento: 'fijo', persona: '', pago: 'Efectivo', meses: [[70000, 20000]] }] };
  const e = plano(calcularFormaPago(d, 0, 'Efectivo'));
  assert.deepEqual(e.filas[e.filas.length - 1], { persona: 'Sin persona', presupuestado: 70000, gastado: 20000, falta: 50000 });
  assert.deepEqual(e.total, { presupuestado: 720000, gastado: 320000, falta: 400000 });
});

test('la tolerancia de "va rápido" sale de la Configuración', () => {
  const d = conGeneral(EJEMPLO, { tolerancia: 0.5 });
  assert.equal(fila(calcularMes(d, 2, HOY), 'Salidas').estado, 'En ritmo');
});

test('diferencia de ingresos: lo que llegó menos lo planeado', () => {
  assert.equal(calcularMes(EJEMPLO, 0, HOY).ingresos.diferencia, -100000);
  assert.equal(calcularMes(EJEMPLO, 2, HOY).ingresos.diferencia, null);
});

test('sin segunda moneda todo se cuenta en la moneda principal y no falta tasa', () => {
  const m = calcularMes({ ...conGeneral(EJEMPLO, { usarSegunda: false }), tasaPlan: [] }, 0, HOY);
  assert.deepEqual(pick(m.ingresos, 'planeado', 'real', 'faltaTasa', 'usdPorCambiar'),
    { planeado: 3002000, real: 2702000, faltaTasa: false, usdPorCambiar: 0 });
});

test('por persona usa el ingreso planeado mientras el mes no tiene ingresos reales', () => {
  assert.deepEqual(plano(calcularMes(EJEMPLO, 2, HOY).personas.map((p) => [p.persona, p.ingresa, p.presupuesta, p.leQueda])),
    [['Ana', 3000000, 2750000, 250000], ['Luis', 7800000, 1450000, 6350000]]);
});
