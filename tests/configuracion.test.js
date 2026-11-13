const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/configuracion.js', 'hojas/listas.js');
const { EJEMPLO, CONFIG, disenoConfiguracion, formulasListas } =
  vm.runInContext('({ EJEMPLO, CONFIG, disenoConfiguracion, formulasListas })', ctx);

test('las tablas de Configuración no se pisan: una columna libre entre tablas', () => {
  const tablas = disenoConfiguracion(EJEMPLO);
  for (let i = 1; i < tablas.length; i++) {
    const previa = tablas[i - 1];
    assert.equal(tablas[i].columna, previa.columna + previa.encabezados.length + 1, tablas[i].titulo);
  }
});

test('con ejemplo, Categorías trae las filas del ejemplo en orden de columnas', () => {
  const cat = disenoConfiguracion(EJEMPLO).find((t) => t.clave === 'Categorias');
  assert.deepEqual([...cat.encabezados], ['Grupo', 'Categoría', 'Tipo', 'Comportamiento', 'Activa']);
  assert.equal(cat.filas.length, EJEMPLO.config.categorias.length);
  assert.deepEqual([...cat.filas[0]], ['Casa', 'Arriendo', 'E', 'fija', true]);
});

test('sin datos usa los valores por defecto, con las subcategorías hormiga marcadas', () => {
  const tablas = disenoConfiguracion();
  const sub = tablas.find((t) => t.clave === 'Subcategorias');
  const marcadas = sub.filas.filter((f) => f[3] === true).map((f) => f[1]);
  assert.deepEqual([...marcadas].sort(), ['Café', 'Comisiones bancarias', 'Compras por impulso', 'Domicilios',
    'Propinas', 'Snacks y golosinas', 'Taxi y apps de transporte']);
  const hormiga = tablas.find((t) => t.clave === 'Hormiga');
  assert.deepEqual([...hormiga.filas[0]], [30000, 3, 3]);
});

test('toda subcategoría por defecto pertenece a una categoría por defecto', () => {
  const tablas = disenoConfiguracion();
  const cats = new Set(tablas.find((t) => t.clave === 'Categorias').filas.map((f) => f[1]));
  for (const f of tablas.find((t) => t.clave === 'Subcategorias').filas) assert.ok(cats.has(f[0]), f[0]);
});

test('los nombres de rango de Configuración son únicos e incluyen los de Hormiga', () => {
  const nombres = disenoConfiguracion().flatMap((t) => t.rangos.map((r) => r.nombre));
  assert.equal(new Set(nombres).size, nombres.length);
  for (const n of ['HormigaMonto', 'HormigaComprasMes', 'HormigaMeses', 'CfgCategoriasActiva', 'CfgSubcategoriasHormiga']) {
    assert.ok(nombres.includes(n), n);
  }
});

test('las fórmulas de _Listas solo usan rangos definidos en Configuración', () => {
  const definidos = new Set(disenoConfiguracion().flatMap((t) => t.rangos.map((r) => r.nombre)));
  for (const { nombre, formula } of formulasListas()) {
    for (const usado of formula.match(/\bCfg[A-Za-z]+\b/g) || []) assert.ok(definidos.has(usado), `${nombre}: ${usado}`);
  }
});

test('_Listas define las listas que usan las pestañas de datos', () => {
  const nombres = formulasListas().map((l) => l.nombre);
  assert.deepEqual([...nombres].sort(), ['ListaCategorias', 'ListaFormasPago', 'ListaMonedas', 'ListaPersonas',
    'ListaPersonasHogar', 'ListaSubcategorias', 'ListaTarjetas', 'ListaTiendas', 'MonedaPrincipal'].sort());
});
