const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/configuracion.js', 'hojas/listas.js', 'hojas/datos.js');
const { EJEMPLO, CONFIG, disenoDatos, formulasListas } = vm.runInContext('({ EJEMPLO, CONFIG, disenoDatos, formulasListas })', ctx);

test('cada tabla de datos usa los encabezados de CONFIG.COLUMNAS', () => {
  for (const t of disenoDatos()) assert.deepEqual([...t.encabezados], Object.values(CONFIG.COLUMNAS[t.clave]), t.clave);
});

test('Presupuesto lleva la tabla base y la de ajustes lado a lado con una columna libre', () => {
  const [base, ajustes] = disenoDatos().filter((t) => t.hoja === CONFIG.HOJAS.presupuesto);
  assert.equal(base.columna, 1);
  assert.equal(ajustes.columna, base.encabezados.length + 2);
});

test('define los rangos con nombre que usa el Panel', () => {
  const nombres = disenoDatos().flatMap((t) => t.rangos.map((r) => r.nombre));
  assert.equal(new Set(nombres).size, nombres.length);
  for (const n of ['MovFecha', 'MovMonto', 'MovMoneda', 'MovSubcategoria', 'MovOrigen', 'IngFecha', 'IngMonto',
    'IngMoneda', 'PresBaseCategoria', 'PresBaseMonto', 'PresBaseVigenteDesde', 'AjusteMes', 'AjusteCategoria',
    'AjusteMonto', 'TarFecha', 'TarMonto', 'TarTarjeta', 'TarSubcategoria', 'TarTienda', 'TarCuotas']) {
    assert.ok(nombres.includes(n), n);
  }
});

test('los desplegables solo usan listas definidas en _Listas', () => {
  const listas = new Set(formulasListas().map((l) => l.nombre));
  for (const t of disenoDatos()) {
    for (const v of Object.values(t.validaciones)) if (v.lista) assert.ok(listas.has(v.lista), `${t.clave}: ${v.lista}`);
  }
});

test('Movimientos valida subcategoría, quién pagó, para quién y origen', () => {
  const mov = disenoDatos().find((t) => t.clave === 'movimientos');
  assert.equal(mov.validaciones.subcategoria.lista, 'ListaSubcategorias');
  assert.equal(mov.validaciones.pago.lista, 'ListaPersonas');
  assert.equal(mov.validaciones.paraQuien.lista, 'ListaPersonasHogar');
  assert.deepEqual([...mov.validaciones.origen.valores], ['celular', 'manual', 'migrado']);
});

test('con ejemplo, las filas traen fechas como Date y meses como día 1', () => {
  const tablas = disenoDatos(EJEMPLO);
  const mov = tablas.find((t) => t.clave === 'movimientos');
  assert.equal(mov.filas.length, EJEMPLO.movimientos.length);
  const fecha = mov.filas[0][0];
  assert.equal(Object.prototype.toString.call(fecha), '[object Date]');
  assert.deepEqual([fecha.getFullYear(), fecha.getMonth(), fecha.getDate()], [2026, 0, 2]);
  const desde = tablas.find((t) => t.clave === 'presupuestoBase').filas[1][2];
  assert.deepEqual([desde.getFullYear(), desde.getMonth(), desde.getDate()], [2026, 2, 1]);
});

test('sin ejemplo, las tablas de datos quedan vacías', () => {
  for (const t of disenoDatos()) assert.equal(t.filas.length, 0, t.clave);
});
