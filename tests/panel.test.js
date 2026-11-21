const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/configuracion.js', 'hojas/listas.js', 'hojas/datos.js', 'oraculo.js', 'hojas/panel.js');
const { disenoConfiguracion, disenoDatos, formulasListas, disenoPanel } =
  vm.runInContext('({ disenoConfiguracion, disenoDatos, formulasListas, disenoPanel })', ctx);

const PREFIJOS = /\b(?:Cfg|Mov|Ing|PresBase|Ajuste|Tar|Lista|Panel|Hormiga)[A-Z][A-Za-z]*\b|\bMonedaPrincipal\b/g;
const definidos = () => new Set([
  ...disenoConfiguracion().flatMap((t) => t.rangos.map((r) => r.nombre)),
  ...disenoDatos().flatMap((t) => t.rangos.map((r) => r.nombre)),
  ...formulasListas().map((l) => l.nombre),
  ...disenoPanel().celdas.filter((c) => c.nombre).map((c) => c.nombre),
]);
const formulas = () => [
  ...formulasListas().map((l) => [l.nombre, l.formula]),
  ...disenoPanel().celdas.filter((c) => c.formula).map((c) => [c.a1, c.formula]),
];
const sinTextos = (f) => f.replace(/"[^"]*"/g, '""');

test('las fórmulas del Panel y de _Listas solo usan rangos con nombre definidos', () => {
  const nombres = definidos();
  for (const [donde, f] of formulas()) {
    for (const n of sinTextos(f).match(PREFIJOS) || []) assert.ok(nombres.has(n), `${donde}: ${n}`);
  }
});

test('las fórmulas tienen paréntesis, llaves y comillas balanceados', () => {
  for (const [donde, f] of formulas()) {
    assert.equal((f.match(/"/g) || []).length % 2, 0, `${donde}: comillas`);
    const t = sinTextos(f);
    for (const [a, c] of [['(', ')'], ['{', '}']]) assert.equal(t.split(a).length, t.split(c).length, `${donde}: ${a}${c}`);
  }
});

test('el Panel define los rangos con nombre del contrato', () => {
  const nombres = disenoPanel().celdas.filter((c) => c.nombre).map((c) => c.nombre);
  for (const n of ['PanelMes', 'PanelIngresos', 'PanelPresupuestado', 'PanelGastado', 'PanelDisponible',
    'PanelSinAsignar', 'PanelTabla', 'PanelTipos']) assert.ok(nombres.includes(n), n);
});

test('el selector de mes ofrece "Mes actual" y se guarda como texto', () => {
  const lista = formulasListas().find((l) => l.nombre === 'ListaMeses');
  assert.match(lista.formula, /^=\{"Mes actual";/);
  const selector = disenoPanel().celdas.find((c) => c.nombre === 'PanelMes');
  assert.equal(selector.valor, 'Mes actual');
  assert.equal(selector.lista, 'ListaMeses');
});

test('los estados del Panel son los mismos textos que da el oráculo', () => {
  const tabla = disenoPanel().celdas.find((c) => c.nombre === 'PanelTabla').formula;
  for (const e of ['Excedido', 'Pendiente', 'Pago parcial', 'Pagado', 'Va rápido', 'En ritmo']) assert.ok(tabla.includes(`"${e}"`), e);
});

test('ningún nombre de LET o LAMBDA tiene forma de referencia de celda', () => {
  for (const [donde, f] of formulas()) {
    const parecidos = sinTextos(f).match(/\b[a-z]{1,3}\d+\b/g) || [];
    assert.deepEqual(parecidos, [], donde);
  }
});
