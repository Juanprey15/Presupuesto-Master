/** Pestaña Configuración: tablas lado a lado (fila 1 título, fila 2 encabezados, datos desde la fila 3). */

const FILA_DATOS_CONFIG = 3;

/** Filas de la tabla General: etiqueta visible, clave en `general` y rango con nombre de su celda. */
const FILAS_GENERAL = [
  ['Nombre del panel', 'nombre', 'CfgNombre'],
  ['Año', 'ano', 'CfgAno'],
  ['Mes en que empieza el año (1 a 12)', 'mesInicio', 'CfgMesInicio'],
  ['Moneda', 'moneda', 'CfgMoneda'],
  ['Segunda moneda (ingresos)', 'segundaMoneda', 'CfgSegundaMoneda'],
  ['Copiar el presupuesto al mes siguiente', 'copiar', 'CfgCopiar'],
  ['Va rápido si el avance supera al del mes en', 'tolerancia', 'CfgTolerancia'],
];

function tablasConfiguracion() {
  return [
    { clave: 'Personas', titulo: 'Personas', columnas: { nombre: 'Persona', activa: 'Activa' }, filasDe: (c) => c.personas },
    { clave: 'FormasPago', titulo: 'Formas de pago', columnas: { nombre: 'Forma de pago', activa: 'Activa' }, filasDe: (c) => c.formasPago },
    { clave: 'Tipos', titulo: 'Tipos de gasto y metas', columnas: { letra: 'Letra', nombre: 'Nombre', meta: 'Meta' }, filasDe: (c) => c.tipos },
    { clave: 'Grupos', titulo: 'Grupos', columnas: { nombre: 'Grupo', orden: 'Orden', activo: 'Activo' }, filasDe: (c) => c.grupos },
  ];
}

/**
 * Disposición de Configuración: por tabla, columna inicial, encabezados, filas y rangos con nombre.
 * La primera tabla es General (clave/valor, un rango por celda). Sin `datos` usa CONFIG.DEFECTOS.
 */
function disenoConfiguracion(datos) {
  const fuente = datos ? datos.config : CONFIG.DEFECTOS;
  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const general = {
    clave: 'General', titulo: 'General', columna: 1, claves: ['dato', 'valor'], encabezados: ['Dato', 'Valor'],
    filas: FILAS_GENERAL.map(([etiqueta, k]) => [etiqueta, fuente.general[k]]),
    rangos: FILAS_GENERAL.map(([, , nombre], i) => ({ nombre, columna: 2, fila: FILA_DATOS_CONFIG + i, unaCelda: true })),
  };
  let columna = 4;
  return [general, ...tablasConfiguracion().map((t) => {
    const claves = Object.keys(t.columnas);
    const diseno = {
      clave: t.clave, titulo: t.titulo, columna, claves,
      encabezados: claves.map((k) => t.columnas[k]),
      filas: t.filasDe(fuente).map((o) => claves.map((k) => o[k])),
      rangos: claves.map((k, i) => ({ nombre: `Cfg${t.clave}${mayuscula(k)}`, columna: columna + i, fila: FILA_DATOS_CONFIG, unaCelda: false })),
    };
    columna += claves.length + 1;
    return diseno;
  })];
}

/** Escribe Configuración en la planilla y define sus rangos con nombre. */
function construirConfiguracion(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.configuracion);
  const P = CONFIG.PALETA;
  const alto = sh.getMaxRows() - FILA_DATOS_CONFIG + 1;
  for (const t of disenoConfiguracion(datos)) {
    const ancho = t.encabezados.length;
    sh.getRange(1, t.columna).setValue(t.titulo).setFontWeight('bold').setFontColor(P.primary);
    sh.getRange(2, t.columna, 1, ancho).setValues([t.encabezados])
      .setBackground(P.deep).setFontColor(P.ground).setFontWeight('bold');
    if (t.clave !== 'General') {
      t.claves.forEach((clave, i) => formatearColumnaConfig(sh.getRange(FILA_DATOS_CONFIG, t.columna + i, alto, 1), clave));
    }
    if (t.filas.length) sh.getRange(FILA_DATOS_CONFIG, t.columna, t.filas.length, ancho).setValues(t.filas);
    for (const r of t.rangos) ss.setNamedRange(r.nombre, sh.getRange(r.fila, r.columna, r.unaCelda ? 1 : alto, 1));
  }
  const celda = (nombre) => ss.getRangeByName(nombre);
  celda('CfgCopiar').insertCheckboxes();
  if (datos ? datos.config.general.copiar : CONFIG.DEFECTOS.general.copiar) celda('CfgCopiar').check();
  celda('CfgMesInicio').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireNumberBetween(1, 12).setAllowInvalid(false).build());
  celda('CfgAno').setNumberFormat('0');
  celda('CfgTolerancia').setNumberFormat('0%');
  sh.setColumnWidth(1, 260);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setFontFamily('Bricolage Grotesque');
  sh.setFrozenRows(2);
}

function formatearColumnaConfig(rango, clave) {
  if (['activa', 'activo'].includes(clave)) rango.insertCheckboxes();
  else if (clave === 'meta') rango.setNumberFormat('0%');
  else if (clave === 'orden') rango.setNumberFormat('0');
}
