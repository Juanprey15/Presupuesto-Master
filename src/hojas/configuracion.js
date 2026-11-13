/** Pestaña Configuración: tablas lado a lado (fila 1 título, fila 2 encabezados, datos desde la fila 3). */

const FILA_DATOS_CONFIG = 3;

function tablasConfiguracion() {
  const lista = (clave) => (c) => c[clave].map((valor) => ({ valor }));
  return [
    { clave: 'Personas', titulo: 'Personas', columnas: { valor: 'Persona' }, filasDe: lista('personas') },
    { clave: 'Grupos', titulo: 'Grupos', columnas: { valor: 'Grupo' }, filasDe: lista('grupos') },
    {
      clave: 'Categorias', titulo: 'Categorías',
      columnas: { grupo: 'Grupo', categoria: 'Categoría', tipo: 'Tipo', comportamiento: 'Comportamiento', activa: 'Activa' },
      filasDe: (c) => c.categorias,
    },
    {
      clave: 'Subcategorias', titulo: 'Subcategorías',
      columnas: { categoria: 'Categoría', subcategoria: 'Subcategoría', activa: 'Activa', hormiga: 'Hormiga' },
      filasDe: (c) => c.subcategorias,
    },
    { clave: 'FormasPago', titulo: 'Formas de pago', columnas: { valor: 'Forma de pago' }, filasDe: lista('formasPago') },
    { clave: 'Tiendas', titulo: 'Tiendas', columnas: { valor: 'Tienda' }, filasDe: lista('tiendas') },
    { clave: 'Tarjetas', titulo: 'Tarjetas de crédito', columnas: { tarjeta: 'Tarjeta', categoriaPago: 'Categoría de pago' }, filasDe: (c) => c.tarjetas },
    { clave: 'Monedas', titulo: 'Monedas', columnas: { moneda: 'Moneda', principal: 'Principal' }, filasDe: (c) => c.monedas },
    { clave: 'Tasas', titulo: 'Tasas fijas por mes', columnas: { mes: 'Mes', moneda: 'Moneda', tasa: 'Tasa' }, filasDe: (c) => c.tasas },
    { clave: 'Metas', titulo: 'Metas E/A/I/N', columnas: { tipo: 'Tipo', pct: '% del ingreso' }, filasDe: (c) => c.metas },
    {
      clave: 'Hormiga', titulo: 'Gasto hormiga',
      columnas: { montoMaximo: 'Monto máximo', comprasPorMes: 'Compras por mes', mesesSeguidos: 'Meses seguidos' },
      filasDe: (c) => [c.hormiga],
      nombres: { montoMaximo: 'HormigaMonto', comprasPorMes: 'HormigaComprasMes', mesesSeguidos: 'HormigaMeses' },
    },
  ];
}

/**
 * Disposición de Configuración: por tabla, columna inicial, encabezados, filas y rangos con nombre.
 * Sin `datos` usa CONFIG.DEFECTOS.
 */
function disenoConfiguracion(datos) {
  const fuente = datos ? Object.assign({}, datos.config, { tasas: datos.tasas }) : CONFIG.DEFECTOS;
  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let columna = 1;
  return tablasConfiguracion().map((t) => {
    const claves = Object.keys(t.columnas);
    const diseno = {
      clave: t.clave, titulo: t.titulo, columna, claves,
      encabezados: claves.map((k) => t.columnas[k]),
      filas: t.filasDe(fuente).map((o) => claves.map((k) => o[k])),
      rangos: claves.map((k, i) => ({
        nombre: (t.nombres && t.nombres[k]) || `Cfg${t.clave}${mayuscula(k)}`,
        columna: columna + i,
        unaCelda: Boolean(t.nombres),
      })),
    };
    columna += claves.length + 1;
    return diseno;
  });
}

/** Escribe Configuración en la planilla y define sus rangos con nombre. */
function construirConfiguracion(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.configuracion);
  const alto = sh.getMaxRows() - FILA_DATOS_CONFIG + 1;
  for (const t of disenoConfiguracion(datos)) {
    const ancho = t.encabezados.length;
    sh.getRange(1, t.columna).setValue(t.titulo).setFontWeight('bold').setFontColor(CONFIG.PALETA.primary);
    sh.getRange(2, t.columna, 1, ancho).setValues([t.encabezados])
      .setBackground(CONFIG.PALETA.deep).setFontColor(CONFIG.PALETA.ground).setFontWeight('bold');
    t.claves.forEach((clave, i) => formatearColumnaConfig(sh.getRange(FILA_DATOS_CONFIG, t.columna + i, alto, 1), clave));
    if (t.filas.length) {
      const valores = t.filas.map((f) => f.map((v, i) => (t.claves[i] === 'mes' ? aFecha(v) : v)));
      sh.getRange(FILA_DATOS_CONFIG, t.columna, valores.length, ancho).setValues(valores);
    }
    for (const r of t.rangos) {
      ss.setNamedRange(r.nombre, sh.getRange(FILA_DATOS_CONFIG, r.columna, r.unaCelda ? 1 : alto, 1));
    }
  }
  sh.setFrozenRows(2);
}

function formatearColumnaConfig(rango, clave) {
  const lista = (valores) => SpreadsheetApp.newDataValidation().requireValueInList(valores, true).build();
  if (['activa', 'hormiga', 'principal'].includes(clave)) rango.insertCheckboxes();
  else if (clave === 'mes') rango.setNumberFormat('yyyy-mm');
  else if (clave === 'pct') rango.setNumberFormat('0%');
  else if (clave === 'tipo') rango.setDataValidation(lista(['E', 'A', 'I', 'N']));
  else if (clave === 'comportamiento') rango.setDataValidation(lista(['fija', 'variable']));
  else if (['montoMaximo', 'tasa'].includes(clave)) rango.setNumberFormat('#,##0.##');
}

/** 'AAAA-MM' o 'AAAA-MM-DD' -> Date local (día 1 si no trae día). */
function aFecha(texto) {
  const [a, m, d] = texto.split('-').map(Number);
  return new Date(a, m - 1, d || 1);
}
