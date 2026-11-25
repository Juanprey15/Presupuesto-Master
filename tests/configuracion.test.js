const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { cargar } = require('./cargar');

const ctx = cargar('config.js', 'ejemplo.js', 'hojas/configuracion.js', 'hojas/listas.js');
const { EJEMPLO, disenoConfiguracion, formulasListas } = vm.runInContext('({ EJEMPLO, disenoConfiguracion, formulasListas })', ctx);
const nombres = () => disenoConfiguracion().flatMap((t) => t.rangos.map((r) => r.nombre));
const ACOTADO = /(?:Gastos|Ingresos)!\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+/;

test('las tablas de Configuración no se pisan: una columna libre entre tablas', () => {
  const tablas = disenoConfiguracion(EJEMPLO);
  for (let i = 1; i < tablas.length; i++) {
    const previa = tablas[i - 1];
    assert.equal(tablas[i].columna, previa.columna + previa.encabezados.length + 1, tablas[i].titulo);
  }
});

test('Configuración define los rangos con nombre del contrato, sin repetir', () => {
  const n = nombres();
  assert.equal(new Set(n).size, n.length);
  for (const x of ['CfgNombre', 'CfgAno', 'CfgMesInicio', 'CfgMoneda', 'CfgSegundaMoneda', 'CfgCopiar',
    'CfgPersonasNombre', 'CfgPersonasActiva', 'CfgFormasPagoNombre', 'CfgFormasPagoActiva',
    'CfgFormasPagoCodigo', 'CfgFormasPagoColor',
    'CfgTiposLetra', 'CfgTiposNombre', 'CfgTiposMeta', 'CfgGruposNombre', 'CfgGruposOrden', 'CfgGruposActivo']) {
    assert.ok(n.includes(x), x);
  }
});

test('la tabla General guarda un valor por celda con nombre', () => {
  const general = disenoConfiguracion(EJEMPLO).find((t) => t.clave === 'General');
  const valor = (nombre) => {
    const r = general.rangos.find((x) => x.nombre === nombre);
    assert.ok(r.unaCelda);
    return general.filas[r.fila - 3][1];
  };
  assert.equal(valor('CfgNombre'), 'Familia Prueba');
  assert.equal(valor('CfgAno'), 2026);
  assert.equal(valor('CfgCopiar'), true);
  assert.equal(valor('CfgSegundaMoneda'), 'USD');
});

test('con ejemplo, Grupos trae nombre, orden y activo', () => {
  const g = disenoConfiguracion(EJEMPLO).find((t) => t.clave === 'Grupos');
  assert.deepEqual([...g.encabezados], ['Grupo', 'Orden', 'Activo']);
  assert.deepEqual([...g.filas[2]], ['Diversión', 3, true]);
});

test('_Listas define las listas de las grillas y del Panel', () => {
  assert.deepEqual([...formulasListas().map((l) => l.nombre)].sort(), ['ListaFormasPago', 'ListaGastosPadre', 'ListaGrupos',
    'ListaMesesAno', 'ListaMesesPanel', 'ListaMonedas', 'ListaPersonas', 'ListaTipos'].sort());
});

test('las fórmulas de _Listas usan rangos definidos y referencias abiertas', () => {
  const definidos = new Set(nombres());
  for (const { nombre, formula } of formulasListas()) {
    for (const usado of formula.match(/\bCfg[A-Za-z]+\b/g) || []) assert.ok(definidos.has(usado), `${nombre}: ${usado}`);
    assert.doesNotMatch(formula, ACOTADO, nombre);
  }
});

test('los meses del año salen de la Configuración y el Panel ofrece "Mes actual"', () => {
  const f = (n) => formulasListas().find((l) => l.nombre === n).formula;
  assert.equal((f('ListaMesesAno').match(/DATE\(CfgAno,CfgMesInicio\+\d+,1\)/g) || []).length, 12);
  assert.match(f('ListaMesesPanel'), /^=\{"Mes actual";DATE\(CfgAno,CfgMesInicio\+0,1\);/);
});

test('la tolerancia de "va rápido" es una celda de Configuración', () => {
  assert.ok(nombres().includes('CfgTolerancia'));
});

test('la segunda moneda se activa con una casilla, apagada por defecto', () => {
  assert.ok(nombres().includes('CfgUsarSegunda'));
  const valor = (d) => { const g = disenoConfiguracion(d).find((t) => t.clave === 'General'); return g.filas[g.rangos.find((x) => x.nombre === 'CfgUsarSegunda').fila - 3][1]; };
  assert.equal(valor(), false);
  assert.equal(valor(EJEMPLO), true);
  assert.match(formulasListas().find((l) => l.nombre === 'ListaMonedas').formula, /CfgUsarSegunda/);
});

test('con datos sin código ni color, Formas de pago recibe los defectos', () => {
  const t = disenoConfiguracion(EJEMPLO).find((x) => x.clave === 'FormasPago');
  assert.deepEqual([...t.encabezados], ['Forma de pago', 'Activa', 'Código', 'Color']);
  assert.deepEqual(JSON.parse(JSON.stringify(t.filas)),
    [['Efectivo', true, 'E', 'Musgo'], ['Digital', true, 'D', 'Pizarra'], ['Tarjeta Azul', false, 'T', 'Arena']]);
});

test('Formas de pago conserva código y color propios; de la novena en adelante, sin color', () => {
  const formasPago = Array.from({ length: 9 }, (_, k) => ({ nombre: `F${k}`, activa: true }));
  formasPago[0] = { nombre: 'Tarjeta de crédito', activa: true, codigo: 'TC', color: 'Cielo' };
  const datos = { config: { ...EJEMPLO.config, formasPago } };
  const filas = disenoConfiguracion(datos).find((x) => x.clave === 'FormasPago').filas;
  assert.deepEqual([...filas[0]], ['Tarjeta de crédito', true, 'TC', 'Cielo']);
  assert.deepEqual([...filas[8]], ['F8', true, 'F', 'Sin color']);
});
