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

test('la paleta es Juan Basic más el color de alerta del boceto', () => {
  assert.deepEqual({ ...CONFIG.PALETA }, {
    ground: '#E8E8E3', surface: '#FFFFFF', ink: '#23262A', muted: '#565C61',
    primary: '#3F5566', accent: '#6F7F3A', deep: '#222C33', line: '#D2D3CC', warn: '#8A4B12',
  });
});
