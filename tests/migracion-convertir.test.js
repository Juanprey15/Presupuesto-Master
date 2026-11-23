const test = require('node:test');
const assert = require('node:assert/strict');
const { convertir, compararTotales, borrador } = require('../scripts/migracion/convertir');

const r = (grupo, desc, persona, pago, presupuesto, pagado, tipo = 'E') => ({ grupo, desc, persona, tipo, pago, presupuesto, pagado });
const d = (item, pago, valor) => ({ item, pago, valor });
const totales = (renglones, ingreso) => ({
  presupuesto: renglones.reduce((a, x) => a + (x.presupuesto || 0), 0),
  pagado: renglones.reduce((a, x) => a + (x.pagado || 0), 0),
  ingreso,
});

/** Dos meses ficticios con la forma de extraerMes. */
function meses() {
  const ene = [
    r('CASA', 'Arriendo', 'Ana', 'Digital', 1000, 1000),
    r('CASA', 'Antojos', 'Luis', 'Efectivo', 100, 80, 'N'),
    r('CASA', 'Mercado Efectivo', 'Luis', 'Efectivo', 300, 300),
    r('CASA', 'Mercado Digital', 'Ana', 'Digital', 500, 500),
    r('CASA', 'Suscripciones Digital', 'Ana', 'Digital', 200, 200),
    r('CASA', 'Luz Digital', 'Ana', 'Digital', 50, 50),
    r('OTROS', 'Taxi viejo', 'Luis', 'Efectivo', 40, null, 'N'),
  ];
  const feb = [
    r('CASA', 'Arriendo', 'Ana', 'Digital', 1000, 1000),
    r('CASA', 'Antojos Efectivo', 'Luis', 'Efectivo', 60, 60, 'N'),
    r('CASA', 'Antojos Digital', 'Ana', 'Digital', 40, null, 'N'),
    r('CASA', 'Mercado Efectivo', 'Luis', 'Efectivo', 300, 300),
    r('CASA', 'Mercado Digital', 'Ana', 'Digital', 500, null),
    r('CASA', 'Suscripciones Digital', 'Ana', 'Digital', 200, 200),
    r('CASA', 'Luz Digital', 'Ana', 'Digital', 50, 50),
    r('OTROS', 'Taxi nuevo', 'Luis', 'Efectivo', null, 30, 'N'),
  ];
  return [
    {
      tasa: 4000, renglones: ene,
      desgloses: {
        Mercado: [d('Carnes', 'Digital', 500), d('huevos', 'Efectivo', 300), d('Pan', 'Efectivo', 0)],
        Suscripciones: [d('Video', 'Digital', 150)],
        'Servicios Públicos': [d('Luz', 'Digital', 80)],
      },
      ingresos: [{ persona: 'Luis', fuente: 'Sueldo', valor: 400000, dolares: 100 }, { persona: 'Ana', fuente: 'Ventas', valor: null, dolares: null }],
      totales: totales(ene, 400000),
    },
    {
      tasa: 3900, renglones: feb,
      desgloses: {
        Mercado: [d('Carnes', 'Digital', 200), d('Carnes', 'Digital', 300), d('Huevos', 'Efectivo', 300)],
        Suscripciones: [d('Video', 'Digital', 150)],
      },
      ingresos: [{ persona: 'Luis', fuente: 'Sueldo', valor: 390000, dolares: 100 }, { persona: 'Ana', fuente: 'Ventas', valor: 5000, dolares: null }],
      totales: totales(feb, 395000),
    },
  ];
}

const TABLA = {
  general: { nombre: 'Familia Prueba', ano: 2026, mesInicio: 1, moneda: 'COP', segundaMoneda: 'USD', usarSegunda: true, copiar: true, tolerancia: 0.1 },
  grupos: { CASA: 'Casa', OTROS: 'No planeados' },
  gastos: [
    { gasto: 'Antojos', de: ['Antojos', 'Antojos Efectivo', 'Antojos Digital'], comportamiento: 'variable' },
    { gasto: 'Mercado', de: ['Mercado Efectivo', 'Mercado Digital'], desglose: 'Mercado', comportamiento: 'variable',
      partes: { huevos: 'Huevos' }, correcciones: [{ mes: 'Feb', item: 'Carnes', ocurrencia: 1, parte: 'Mensual' }] },
    { gasto: 'Suscripciones', de: ['Suscripciones Digital'], desglose: 'Suscripciones' },
    { gasto: 'Luz', de: ['Luz Digital'], desglose: 'Servicios Públicos' },
    { gasto: 'Taxi', de: ['Taxi viejo', 'Taxi nuevo'], grupo: 'Transporte' },
  ],
};

const fila = (datos, gasto, parteDe = '') => datos.gastos.find((g) => g.gasto === gasto && g.parteDe === parteDe);
const mesesDe = (g) => g.meses.slice(0, 2);

test('renglón propio: valores por mes y el grupo renombrado', () => {
  const a = fila(convertir(meses(), TABLA), 'Arriendo');
  assert.deepEqual([a.grupo, a.persona, a.pago, a.tipo, a.comportamiento], ['Casa', 'Ana', 'Digital', 'E', 'fijo']);
  assert.deepEqual(mesesDe(a), [[1000, 1000], [1000, 1000]]);
});

test('unificación por "de" y valor vacío: presupuesto 0 y real vacío', () => {
  const t = fila(convertir(meses(), TABLA), 'Taxi');
  assert.equal(t.grupo, 'Transporte');
  assert.deepEqual(mesesDe(t), [[40, null], [0, 30]]);
});

test('gasto partido después: el renglón único va a la parte de su forma de pago', () => {
  const datos = convertir(meses(), TABLA);
  const antojos = fila(datos, 'Antojos');
  assert.deepEqual([antojos.comportamiento, antojos.persona, antojos.pago], ['variable', '', '']);
  assert.deepEqual(mesesDe(antojos), [[null, 80], [null, 60]]);
  assert.deepEqual(mesesDe(fila(datos, 'Efectivo', 'Antojos')), [[100, null], [60, null]]);
  assert.deepEqual(mesesDe(fila(datos, 'Digital', 'Antojos')), [[0, null], [40, null]]);
  assert.equal(fila(datos, 'Digital', 'Antojos').persona, 'Ana');
});

test('desglose completo: partes renombradas, corregidas, sumadas y sin ítems en 0', () => {
  const datos = convertir(meses(), TABLA);
  const partes = datos.gastos.filter((g) => g.parteDe === 'Mercado').map((g) => [g.gasto, g.pago, g.persona, ...mesesDe(g).map((m) => m[0])]);
  assert.deepEqual(partes, [['Carnes', 'Digital', 'Ana', 500, 300], ['Huevos', 'Efectivo', 'Luis', 300, 300], ['Mensual', 'Digital', 'Ana', 0, 200]]);
  assert.deepEqual(mesesDe(fila(datos, 'Mercado')), [[null, 800], [null, 300]]);
});

test('desglose incompleto: "Sin detallar" con la diferencia', () => {
  const datos = convertir(meses(), TABLA);
  const partes = datos.gastos.filter((g) => g.parteDe === 'Suscripciones').map((g) => [g.gasto, ...mesesDe(g).map((m) => m[0])]);
  assert.deepEqual(partes, [['Video', 150, 150], ['Sin detallar', 50, 50]]);
});

test('desglose mayor que el renglón: partes por forma de pago', () => {
  const datos = convertir(meses(), TABLA);
  assert.deepEqual(datos.gastos.filter((g) => g.parteDe === 'Luz').map((g) => [g.gasto, ...mesesDe(g).map((m) => m[0])]), [['Digital', 50, 50]]);
});

test('ingresos en dólares, tasa por mes y un cambio por mes', () => {
  const datos = convertir(meses(), TABLA);
  assert.deepEqual(datos.ingresos.map((i) => [i.fuente, i.persona, i.moneda, ...i.meses.slice(0, 2)]), [
    ['Sueldo', 'Luis', 'USD', [100, 100], [100, 100]],
    ['Ventas', 'Ana', 'COP', [0, null], [5000, 5000]],
  ]);
  assert.deepEqual(datos.tasaPlan, [4000, 3900]);
  assert.deepEqual(datos.cambios, [{ mes: 0, fecha: '', dolares: 100, tasa: 4000 }, { mes: 1, fecha: '', dolares: 100, tasa: 3900 }]);
});

test('configuración: personas, formas de pago y grupos en orden de aparición', () => {
  const c = convertir(meses(), TABLA).config;
  assert.deepEqual(c.personas.map((p) => p.nombre), ['Ana', 'Luis']);
  assert.deepEqual(c.formasPago.map((p) => p.nombre), ['Digital', 'Efectivo']);
  assert.deepEqual(c.grupos.map((g) => [g.nombre, g.orden]), [['Casa', 1], ['No planeados', 2], ['Transporte', 3]]);
  assert.deepEqual(c.general, TABLA.general);
});

test('los totales de cada mes coinciden con la hoja vieja', () => {
  const m = meses();
  assert.deepEqual(compararTotales(m, convertir(m, TABLA)), []);
  m[1].totales.pagado += 1;
  assert.deepEqual(compararTotales(m, convertir(m, TABLA)), [{ mes: 'Feb', campo: 'pagado', viejo: m[1].totales.pagado, nuevo: m[1].totales.pagado - 1 }]);
});

test('borrador: pares Efectivo/Digital agrupados y desglose por título', () => {
  const b = borrador(meses(), 2026);
  assert.deepEqual(b.gastos.find((g) => g.gasto === 'Mercado'), { gasto: 'Mercado', de: ['Mercado Efectivo', 'Mercado Digital'], desglose: 'Mercado' });
  assert.equal(b.grupos.CASA, 'CASA');
  assert.equal(b.general.ano, 2026);
});

test('una forma de pago con presupuesto 0 no crea parte', () => {
  const m = meses();
  m[0].renglones.push(r('CASA', 'Suscripciones Efectivo', 'Luis', 'Efectivo', 0, null));
  m[0].desgloses.Suscripciones = [];
  const tabla = { ...TABLA, gastos: TABLA.gastos.map((g) => (g.gasto === 'Suscripciones' ? { ...g, de: ['Suscripciones Efectivo', 'Suscripciones Digital'] } : g)) };
  const datos = convertir(m, tabla);
  assert.deepEqual(datos.gastos.filter((g) => g.parteDe === 'Suscripciones').map((g) => g.gasto), ['Digital', 'Video', 'Sin detallar']);
});

test('partes por renglón: cada renglón unificado es una parte con el nombre que da la tabla', () => {
  const m = meses();
  m[1].renglones.push(r('OTROS', 'Grado', 'Ana', 'Digital', 70, 70, 'N'));
  m[1].totales = totales(m[1].renglones, m[1].totales.ingreso);
  const tabla = { ...TABLA, gastos: [...TABLA.gastos,
    { gasto: 'Arriendo', de: ['Arriendo', 'Grado'], grupo: 'Casa', partesPorRenglon: { Arriendo: 'Mensualidad', Grado: 'Cobro Extra' } }] };
  const datos = convertir(m, tabla);
  assert.deepEqual(datos.gastos.filter((g) => g.parteDe === 'Arriendo').map((g) => [g.gasto, g.pago, g.persona, ...mesesDe(g).map((x) => x[0])]),
    [['Mensualidad', 'Digital', 'Ana', 1000, 1000], ['Cobro Extra', 'Digital', 'Ana', 0, 70]]);
  assert.deepEqual(mesesDe(fila(datos, 'Arriendo')), [[null, 1000], [null, 1070]]);
  assert.equal(fila(datos, 'Grado'), undefined);
  assert.deepEqual(compararTotales(m, datos), []);
});
