const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js');
const { CONFIG, EJEMPLO } = vm.runInContext('({ CONFIG, EJEMPLO })', ctx);
const { config, movimientos, ingresos, presupuestoBase, ajustes, tarjeta, tasas } = EJEMPLO;
const mesDe = (fecha) => fecha.slice(0, 7);
const subsValidas = new Set(config.subcategorias.map((s) => `${s.categoria} › ${s.subcategoria}`));
const categoriaDe = (sub) => sub.split(' › ')[0];

test('las filas usan exactamente las claves de CONFIG.COLUMNAS', () => {
  const tablas = { movimientos, ingresos, presupuestoBase, ajustes, tarjeta };
  for (const [nombre, filas] of Object.entries(tablas)) {
    for (const fila of filas) assert.deepEqual(Object.keys(fila), Object.keys(CONFIG.COLUMNAS[nombre]), nombre);
  }
});

test('cubre tres meses, de 2026-01 a 2026-03', () => {
  assert.deepEqual([...new Set(movimientos.map((m) => mesDe(m.fecha)))].sort(), ['2026-01', '2026-02', '2026-03']);
});

test('hay un ingreso en USD con tasa fija para cada mes', () => {
  for (const mes of ['2026-01', '2026-02', '2026-03']) {
    assert.ok(ingresos.some((i) => i.moneda === 'USD' && mesDe(i.fecha) === mes));
    assert.ok(tasas.some((t) => t.moneda === 'USD' && t.mes === mes && t.tasa > 0));
  }
});

test('hay una categoría desactivada con movimientos solo en enero', () => {
  const inactivas = config.categorias.filter((c) => !c.activa).map((c) => c.categoria);
  assert.equal(inactivas.length, 1);
  const meses = movimientos.filter((m) => categoriaDe(m.subcategoria) === inactivas[0]).map((m) => mesDe(m.fecha));
  assert.deepEqual([...new Set(meses)], ['2026-01']);
});

test('hay un cambio de presupuesto base vigente desde 2026-03 y un ajuste en 2026-02', () => {
  assert.ok(presupuestoBase.some((p) => p.vigenteDesde === '2026-03'));
  assert.ok(ajustes.some((a) => a.mes === '2026-02'));
});

test('hay una compra con tarjeta a 3 cuotas en una tarjeta con categoría de pago presupuestada', () => {
  const compra = tarjeta.find((t) => t.cuotas === 3);
  assert.ok(compra);
  const { categoriaPago } = config.tarjetas.find((t) => t.tarjeta === compra.tarjeta);
  assert.ok(presupuestoBase.some((p) => p.categoria === categoriaPago));
});

test('hay una subcategoría hormiga con compras sobre y bajo el monto máximo, una con tarjeta', () => {
  const marcadas = new Set(config.subcategorias.filter((s) => s.hormiga).map((s) => `${s.categoria} › ${s.subcategoria}`));
  const max = config.hormiga.montoMaximo;
  const enMarcadas = movimientos.filter((m) => marcadas.has(m.subcategoria) && m.monto != null);
  assert.ok(enMarcadas.some((m) => m.monto > max));
  assert.ok(enMarcadas.some((m) => m.monto <= max));
  assert.ok(tarjeta.some((t) => marcadas.has(t.subcategoria)));
});

test('hay una no marcada con 3+ compras chicas en los 3 meses y otra que lo cumple solo 2 meses', () => {
  const { montoMaximo, comprasPorMes } = config.hormiga;
  const noMarcadas = config.subcategorias.filter((s) => !s.hormiga).map((s) => `${s.categoria} › ${s.subcategoria}`);
  const mesesQueCumple = (sub) => ['2026-01', '2026-02', '2026-03'].filter((mes) =>
    movimientos.filter((m) => m.subcategoria === sub && mesDe(m.fecha) === mes && m.monto != null && m.monto <= montoMaximo && m.origen !== 'migrado').length >= comprasPorMes).length;
  const cuentas = noMarcadas.map(mesesQueCumple);
  assert.ok(cuentas.includes(3));
  assert.ok(cuentas.includes(2));
});

test('hay un movimiento migrado, uno con subcategoría inexistente y uno sin monto', () => {
  assert.ok(movimientos.some((m) => m.origen === 'migrado'));
  assert.equal(movimientos.filter((m) => !subsValidas.has(m.subcategoria)).length, 1);
  assert.ok(movimientos.some((m) => m.monto == null));
});

test('los nombres de personas, tiendas y tarjetas son los ficticios del ejemplo', () => {
  assert.deepEqual([...config.personas], ['Ana', 'Luis', 'Sol']);
  for (const m of movimientos) {
    assert.ok(config.personas.includes(m.pago), m.pago);
    if (m.tienda) assert.ok(config.tiendas.includes(m.tienda), m.tienda);
  }
});
