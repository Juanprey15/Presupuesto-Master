const test = require('node:test');
const assert = require('node:assert/strict');
const { cargar } = require('./cargar');

// Los const de nivel superior de un script no quedan como propiedad del contexto; se leen con una expresion.
const leer = (ctx, expr) => require('node:vm').runInContext(expr, ctx);
const ctx = cargar('config.js');
const CONFIG = leer(ctx, 'CONFIG');

test('VERSION tiene formato semver', () => {
  assert.match(CONFIG.VERSION, /^\d+\.\d+\.\d+/);
});

test('los nombres de pestañas son únicos y _Listas es oculta por nombre', () => {
  const nombres = Object.values(CONFIG.HOJAS);
  assert.equal(new Set(nombres).size, nombres.length);
  assert.ok(CONFIG.HOJAS.listas.startsWith('_'));
});

test('pestañas de la hoja anual', () => {
  assert.deepEqual({ ...CONFIG.HOJAS }, {
    inicio: 'Inicio', panel: 'Panel', gastos: 'Gastos', ingresos: 'Ingresos', configuracion: 'Configuración', listas: '_Listas',
  });
});

test('dimensiones de las grillas y defectos', () => {
  assert.deepEqual([CONFIG.MESES, CONFIG.FILA_DATOS, CONFIG.FILAS_GASTOS, CONFIG.FILAS_INGRESOS, CONFIG.TOLERANCIA_RITMO],
    [12, 3, 200, 20, 0.1]);
  assert.equal(CONFIG.DEFECTOS.general.copiar, true);
  assert.equal(CONFIG.DEFECTOS.general.mesInicio, 1);
  assert.deepEqual(Object.values(CONFIG.COLUMNAS.gastos), ['Gasto', 'Grupo', 'Parte de', 'Tipo', 'Comportamiento', 'Persona', 'Pago']);
  assert.deepEqual(Object.values(CONFIG.COLUMNAS.ingresos), ['Fuente', 'Persona', 'Moneda']);
  assert.deepEqual(Object.values(CONFIG.COLUMNAS.cambios), ['Mes del ingreso', 'Fecha', 'Dólares', 'Tasa', 'En pesos']);
});

test('la paleta es Juan Basic más el color de alerta del boceto', () => {
  assert.deepEqual({ ...CONFIG.PALETA }, {
    ground: '#E8E8E3', surface: '#FFFFFF', ink: '#23262A', muted: '#565C61',
    primary: '#3F5566', accent: '#6F7F3A', deep: '#222C33', line: '#D2D3CC', warn: '#8A4B12',
  });
});

test('la paleta de formas de pago tiene 8 tonos con nombres distintos', () => {
  const nombres = CONFIG.PALETA_PAGO.map(([nombre]) => nombre);
  assert.deepEqual([...nombres], ['Musgo', 'Pizarra', 'Arena', 'Malva', 'Cielo', 'Durazno', 'Salvia', 'Gris']);
  assert.ok(CONFIG.PALETA_PAGO.every(([, hex]) => /^#[0-9A-F]{6}$/.test(hex)));
  assert.equal(CONFIG.SIN_COLOR, 'Sin color');
});
