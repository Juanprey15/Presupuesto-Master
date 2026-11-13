const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'oraculo.js');
const { EJEMPLO, calcularPanel, presupuestoDe, cuotasDe, aMonedaPrincipal } =
  vm.runInContext('({ EJEMPLO, calcularPanel, presupuestoDe, cuotasDe, aMonedaPrincipal })', ctx);
const PASADO = new Date(2026, 10, 13);
const fila = (panel, categoria) => panel.filas.find((f) => f.categoria === categoria);

test('KPIs de febrero', () => {
  const p = calcularPanel(EJEMPLO, '2026-02', PASADO);
  // 1000 USD x 4100 + 2.000.000
  assert.equal(p.ingresos, 6100000);
  // 1.5M + 0.3M + 1.0M (ajuste Mercado) + 0.1M + 0.7M + 0.2M + 0.4M + 0.25M; Gimnasio inactiva sin gasto en febrero
  assert.equal(p.presupuestado, 4450000);
  // Arriendo 1.5M, Servicios 200k, Mercado 1.065M, Antojos 69k, Colegio 300k, Salidas 70k, Ahorro 400k, Tarjeta 250k, Sin categoría 20k
  assert.equal(p.gastado, 3874000);
  assert.equal(p.disponible, 6100000 - 3874000);
  assert.equal(p.sinAsignar, 6100000 - 4450000);
});

test('estados de febrero (mes pasado)', () => {
  const p = calcularPanel(EJEMPLO, '2026-02', PASADO);
  const estados = Object.fromEntries(p.filas.map((f) => [f.categoria, f.estado]));
  assert.deepEqual(estados, {
    Arriendo: 'pagado', Servicios: 'pago parcial', Mercado: 'excedido', Antojos: 'en ritmo',
    'Colegio Sol': 'pago parcial', Salidas: 'en ritmo', Ahorro: 'pagado', 'Pago Tarjeta Azul': 'pagado',
    'Sin categoría': 'excedido',
  });
});

test('las compras con tarjeta no suman al gastado', () => {
  // Antojos en febrero: Café 3 x 8.000 + Domicilios 45.000; los Snacks con tarjeta (12.000) no cuentan
  assert.equal(fila(calcularPanel(EJEMPLO, '2026-02', PASADO), 'Antojos').gastado, 69000);
});

test('ritmo del mes en curso: va rápido y en ritmo', () => {
  // 10 de marzo: 10/31 = 0,32 del mes. Mercado 500k/800k = 0,625 > 0,42 -> va rápido.
  // Antojos: el café migrado suma al gastado (32.000) pero el ritmo usa 24.000/100.000 = 0,24 -> en ritmo.
  const p = calcularPanel(EJEMPLO, '2026-03', new Date(2026, 2, 10));
  assert.equal(fila(p, 'Mercado').estado, 'va rápido');
  assert.equal(fila(p, 'Antojos').gastado, 32000);
  assert.equal(fila(p, 'Antojos').estado, 'en ritmo');
  assert.equal(fila(p, 'Colegio Sol').estado, 'pendiente');
});

test('una variable con solo movimientos migrados queda pagado', () => {
  assert.equal(fila(calcularPanel(EJEMPLO, '2026-01', PASADO), 'Salidas').estado, 'pagado');
});

test('el presupuesto base respeta la vigencia y el ajuste puntual', () => {
  assert.equal(presupuestoDe(EJEMPLO, 'Arriendo', '2026-02'), 1500000);
  assert.equal(presupuestoDe(EJEMPLO, 'Arriendo', '2026-03'), 1600000);
  assert.equal(presupuestoDe(EJEMPLO, 'Mercado', '2026-02'), 1000000);
  assert.equal(presupuestoDe(EJEMPLO, 'Mercado', '2026-03'), 800000);
  assert.equal(presupuestoDe(EJEMPLO, 'Arriendo', '2025-12'), 0);
});

test('la categoría desactivada aparece en enero y no en marzo', () => {
  const enero = fila(calcularPanel(EJEMPLO, '2026-01', PASADO), 'Gimnasio');
  assert.equal(enero.gastado, 120000);
  assert.equal(enero.estado, 'pagado');
  assert.equal(fila(calcularPanel(EJEMPLO, '2026-03', PASADO), 'Gimnasio'), undefined);
});

test('la fila con subcategoría inexistente va a Sin categoría y la fila sin monto se ignora', () => {
  const sc = fila(calcularPanel(EJEMPLO, '2026-02', PASADO), 'Sin categoría');
  assert.equal(sc.gastado, 20000);
  assert.equal(sc.presupuesto, 0);
});

test('reparto por tipo de febrero', () => {
  const tipos = Object.fromEntries(calcularPanel(EJEMPLO, '2026-02', PASADO).tipos.map((t) => [t.tipo, t]));
  assert.equal(tipos.E.gastado, 3315000);
  assert.equal(tipos.A.gastado, 400000);
  assert.equal(tipos.I.gastado, 0);
  assert.equal(tipos.N.gastado, 139000);
  assert.equal(tipos.E.pctIngreso, 3315000 / 6100000);
  assert.equal(tipos.E.meta, 0.5);
});

test('un mes sin movimientos da ceros, pendientes y ningún NaN', () => {
  const p = calcularPanel(EJEMPLO, '2026-04', PASADO);
  assert.equal(p.ingresos, 0);
  assert.equal(p.gastado, 0);
  assert.equal(p.disponible, 0);
  assert.equal(p.sinAsignar, -p.presupuestado);
  assert.equal(fila(p, 'Arriendo').estado, 'pendiente');
  assert.equal(fila(p, 'Sin categoría'), undefined);
  const numeros = [p.ingresos, p.presupuestado, p.gastado, p.disponible, p.sinAsignar,
    ...p.filas.flatMap((f) => [f.presupuesto, f.gastado, f.avance]), ...p.tipos.flatMap((t) => [t.gastado, t.pctIngreso])];
  assert.ok(numeros.every(Number.isFinite));
});

test('cuotas de tarjeta como referencia, sin sumar al presupuesto', () => {
  // Audífonos 900.000 a 3 cuotas desde febrero -> 300.000 en marzo, abril y mayo; Snacks 12.000 a 1 cuota -> marzo
  assert.equal(cuotasDe(EJEMPLO, 'Tarjeta Azul', '2026-02'), 0);
  assert.equal(cuotasDe(EJEMPLO, 'Tarjeta Azul', '2026-03'), 312000);
  assert.equal(cuotasDe(EJEMPLO, 'Tarjeta Azul', '2026-05'), 300000);
  assert.equal(cuotasDe(EJEMPLO, 'Tarjeta Azul', '2026-06'), 0);
  const marzo = fila(calcularPanel(EJEMPLO, '2026-03', PASADO), 'Pago Tarjeta Azul');
  assert.equal(marzo.presupuesto, 250000);
  assert.equal(marzo.segunCompras, 312000);
  assert.equal(fila(calcularPanel(EJEMPLO, '2026-03', PASADO), 'Mercado').segunCompras, null);
});

test('conversión a moneda principal', () => {
  assert.equal(aMonedaPrincipal(EJEMPLO, 1000, 'USD', '2026-03'), 4200000);
  assert.equal(aMonedaPrincipal(EJEMPLO, 5000, 'COP', '2026-03'), 5000);
  assert.equal(aMonedaPrincipal(EJEMPLO, 5000, '', '2026-03'), 5000);
  assert.throws(() => aMonedaPrincipal(EJEMPLO, 1, 'USD', '2026-04'), /tasa/i);
});

const { calcularHormiga } = vm.runInContext('({ calcularHormiga })', ctx);
const grupo = (h, sub) => h.grupos.find((g) => g.subcategoria === sub);

test('hormiga de febrero: marcadas sin tope de monto, incluida la compra con tarjeta', () => {
  const h = calcularHormiga(EJEMPLO, '2026-02');
  // Ventana dic-feb limitada al primer mes con datos (enero): promedio de 2 meses x 12
  assert.deepEqual(JSON.parse(JSON.stringify(h.grupos.map((g) => [g.subcategoria, g.tipo, g.cantidad, g.totalMes, g.proyeccionAnual]))), [
    ['Antojos › Domicilios', 'hormiga', 1, 45000, 270000],
    ['Antojos › Café', 'hormiga', 3, 24000, 288000],
    ['Antojos › Snacks y golosinas', 'hormiga', 1, 12000, 72000],
  ]);
  assert.equal(h.total, 81000);
  assert.equal(h.pctIngreso, 81000 / 6100000);
  assert.equal(grupo(h, 'Antojos › Café').pctIngreso, 24000 / 6100000);
});

test('hormiga de marzo: el migrado no cuenta y aparece la posible hormiga de 3 meses', () => {
  const h = calcularHormiga(EJEMPLO, '2026-03');
  assert.deepEqual(JSON.parse(JSON.stringify(h.grupos.map((g) => [g.subcategoria, g.tipo, g.cantidad, g.totalMes, g.proyeccionAnual]))), [
    ['Antojos › Café', 'hormiga', 3, 24000, 288000],
    ['Mercado › Panadería', 'posible', 3, 15000, 180000],
  ]);
  // Heladería cumple solo febrero y marzo: no aparece. El total solo suma las marcadas.
  assert.equal(grupo(h, 'Salidas › Heladería'), undefined);
  assert.equal(h.total, 24000);
});

test('hormiga de un mes sin datos ni ingresos: vacío y sin NaN', () => {
  const h = calcularHormiga(EJEMPLO, '2026-04');
  assert.equal(h.grupos.length, 0);
  assert.equal(h.total, 0);
  assert.equal(h.pctIngreso, 0);
});
