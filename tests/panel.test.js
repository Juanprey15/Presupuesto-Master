const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/grilla.js', 'hojas/configuracion.js', 'hojas/listas.js', 'hojas/panel.js');
const { disenoConfiguracion, formulasListas, disenoPanel } =
  vm.runInContext('({ disenoConfiguracion, formulasListas, disenoPanel })', ctx);

const PREFIJOS = /\b(?:Cfg|Lista|Panel)[A-Z][A-Za-z]*\b/g;
const ACOTADO = /(?:Gastos|Ingresos)!\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+/;
const celdas = () => disenoPanel().celdas;
const definidos = () => new Set([
  ...disenoConfiguracion().flatMap((t) => t.rangos.map((r) => r.nombre)),
  ...formulasListas().map((l) => l.nombre),
  ...celdas().filter((c) => c.nombre).map((c) => c.nombre),
]);
const formulas = () => celdas().filter((c) => c.formula).map((c) => [c.a1, c.formula]);
const formulaDe = (nombre) => celdas().find((c) => c.nombre === nombre).formula;
const sinTextos = (f) => f.replace(/"[^"]*"/g, '""');

test('las fórmulas del Panel solo usan rangos con nombre definidos', () => {
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

test('ningún nombre de LET o LAMBDA tiene forma de celda ni es R o C sueltos', () => {
  for (const [donde, f] of formulas()) {
    const t = sinTextos(f);
    assert.deepEqual(t.match(/\b[a-z]{1,3}\d+\b/g) || [], [], donde);
    assert.doesNotMatch(t, /LAMBDA\((?:[^)]*,)?\s*[rc]\s*[,)]/, donde);
  }
});

test('ninguna fórmula lee Gastos o Ingresos con fila final', () => {
  for (const [donde, f] of formulas()) assert.doesNotMatch(f, ACOTADO, donde);
});

test('el Panel define los rangos con nombre del contrato', () => {
  const nombres = celdas().filter((c) => c.nombre).map((c) => c.nombre);
  for (const n of ['PanelMes', 'PanelIndice', 'PanelMesInicio', 'PanelFraccion', 'PanelIngresos', 'PanelIngresosEtiqueta',
    'PanelGastado', 'PanelQueda', 'PanelPresupuestado', 'PanelSinAsignar', 'PanelSinAsignarEtiqueta', 'PanelTabla',
    'PanelFormaPago', 'PanelFormaPagoTabla', 'PanelFormaPagoNota', 'PanelTasa', 'PanelIngresosMes', 'PanelAvisoTasa',
    'PanelTipos', 'PanelPersonas', 'PanelAno']) assert.ok(nombres.includes(n), n);
});

test('los selectores y sus listas', () => {
  const mes = celdas().find((c) => c.nombre === 'PanelMes');
  assert.equal(mes.valor, 'Mes actual');
  assert.equal(mes.lista, 'ListaMesesPanel');
  assert.equal(celdas().find((c) => c.nombre === 'PanelFormaPago').lista, 'ListaFormasPago');
});

test('la tabla usa los textos de estado, el grupo por defecto y lee montos con ISNUMBER', () => {
  const t = formulaDe('PanelTabla');
  for (const e of ['Excedido', 'Pendiente', 'Pago parcial', 'Pagado', 'Va rápido', 'En ritmo', 'Sin grupo']) assert.ok(t.includes(`"${e}"`), e);
  assert.ok(t.includes('ISNUMBER(rr)'));
});

test('avisos de la tasa y del gastado sin contar', () => {
  assert.ok(formulaDe('PanelAvisoTasa').includes('"Falta la tasa para planear"'));
  assert.ok(formulaDe('PanelFormaPagoNota').includes('"Gastado sin contar: "'));
  assert.ok(formulaDe('PanelSinAsignarEtiqueta').includes('"Sobre-asignado"'));
});

test('los totales suman la tabla entera, sin fila final', () => {
  assert.equal(formulaDe('PanelGastado'), '=SUM(AE12:AE)');
  assert.equal(formulaDe('PanelPresupuestado'), '=SUM(AD12:AD)');
});

test('forma de pago con fila "Sin persona" y tolerancia desde Configuración', () => {
  assert.ok(formulaDe('PanelFormaPagoTabla').includes('"Sin persona"'));
  assert.ok(formulaDe('PanelTabla').includes('CfgTolerancia'));
});

test('un cambio cuenta en su mes aunque la fecha no sea el día 1', () => {
  const f = formulaDe('PanelIngresosCalc');
  assert.ok(f.includes('(cmes>=ini)*(cmes<EDATE(ini,1))'));
  assert.ok(!f.includes('cmes=ini'));
});

test('distribución del boceto: tabla visible en B:H, recuadros en J:N y selectores a la vista', () => {
  const en = (a1) => celdas().find((c) => c.a1 === a1);
  assert.equal(en('AB12').nombre, 'PanelTabla');
  assert.match(en('B12').formula, /AB12:AB211/);
  assert.match(en('C12').formula, /AC12:AF211/);
  assert.match(en('G12').formula, /^=IF\(C12="","",SPARKLINE\(MIN\(AG12,1\)/);
  assert.match(en('H12').formula, /AH12:AH211/);
  assert.equal(en('L1').nombre, 'PanelMes');
  assert.equal(en('L6').nombre, 'PanelFormaPago');
  assert.equal(en('J9').nombre, 'PanelFormaPagoTabla');
  assert.equal(en('AJ11').nombre, 'PanelAno');
});
