/**
 * Pestañas de datos del usuario: Movimientos, Ingresos, Presupuesto (base y ajustes) y Compras con tarjeta.
 * Solo datos escritos por el usuario, nunca fórmulas: se copian y pegan entre versiones.
 */

const COLUMNAS_FECHA = ['fecha'];
const COLUMNAS_MES = ['mes', 'vigenteDesde'];

function tablasDatos() {
  const H = CONFIG.HOJAS;
  return [
    { clave: 'movimientos', hoja: H.movimientos, prefijo: 'Mov' },
    { clave: 'ingresos', hoja: H.ingresos, prefijo: 'Ing' },
    { clave: 'presupuestoBase', hoja: H.presupuesto, prefijo: 'PresBase' },
    { clave: 'ajustes', hoja: H.presupuesto, prefijo: 'Ajuste' },
    { clave: 'tarjeta', hoja: H.tarjeta, prefijo: 'Tar' },
  ];
}

/** Validación de cada columna según su clave. */
function validacionDe(clave) {
  const porClave = {
    subcategoria: { lista: 'ListaSubcategorias' },
    pago: { lista: 'ListaPersonas' },
    persona: { lista: 'ListaPersonas' },
    paraQuien: { lista: 'ListaPersonasHogar' },
    formaPago: { lista: 'ListaFormasPago' },
    tienda: { lista: 'ListaTiendas' },
    moneda: { lista: 'ListaMonedas' },
    tarjeta: { lista: 'ListaTarjetas' },
    categoria: { lista: 'ListaCategorias' },
    origen: { valores: ['celular', 'manual', 'migrado'] },
    fecha: { fecha: true },
    mes: { mes: true },
    vigenteDesde: { mes: true },
    monto: { numero: true },
    cuotas: { entero: true },
  };
  return porClave[clave];
}

/** Disposición de las tablas de datos; con `datos` incluye sus filas, convertidas a valores de celda. */
function disenoDatos(datos) {
  const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const columnaPorHoja = {};
  return tablasDatos().map((t) => {
    const columnas = CONFIG.COLUMNAS[t.clave];
    const claves = Object.keys(columnas);
    const columna = columnaPorHoja[t.hoja] || 1;
    columnaPorHoja[t.hoja] = columna + claves.length + 1;
    const validaciones = {};
    claves.forEach((k) => { const v = validacionDe(k); if (v) validaciones[k] = v; });
    const celda = (k, v) => {
      if (v == null || v === '') return '';
      return COLUMNAS_FECHA.includes(k) || COLUMNAS_MES.includes(k) ? aFecha(v) : v;
    };
    return {
      clave: t.clave, hoja: t.hoja, columna, claves, validaciones,
      encabezados: claves.map((k) => columnas[k]),
      filas: datos ? datos[t.clave].map((o) => claves.map((k) => celda(k, o[k]))) : [],
      rangos: claves.map((k, i) => ({ nombre: `${t.prefijo}${mayuscula(k)}`, columna: columna + i })),
    };
  });
}

/** Escribe encabezados, validaciones, formatos, filas y rangos con nombre de las pestañas de datos. */
function construirDatos(ss, datos) {
  for (const t of disenoDatos(datos)) {
    const sh = ss.getSheetByName(t.hoja);
    const alto = sh.getMaxRows() - 1;
    sh.getRange(1, t.columna, 1, t.encabezados.length).setValues([t.encabezados])
      .setBackground(CONFIG.PALETA.deep).setFontColor(CONFIG.PALETA.ground).setFontWeight('bold');
    t.claves.forEach((clave, i) => {
      const rango = sh.getRange(2, t.columna + i, alto, 1);
      aplicarValidacion(ss, rango, t.validaciones[clave]);
      ss.setNamedRange(t.rangos[i].nombre, rango);
    });
    if (t.filas.length) sh.getRange(2, t.columna, t.filas.length, t.encabezados.length).setValues(t.filas);
    sh.setFrozenRows(1);
  }
}

function aplicarValidacion(ss, rango, v) {
  if (!v) return;
  const regla = SpreadsheetApp.newDataValidation().setAllowInvalid(true);
  if (v.lista) regla.requireValueInRange(ss.getRangeByName(v.lista), true);
  else if (v.valores) regla.requireValueInList(v.valores, true);
  else if (v.fecha || v.mes) regla.requireDate();
  else if (v.numero) regla.requireNumberGreaterThanOrEqualTo(0);
  else if (v.entero) regla.requireNumberBetween(1, 120).setAllowInvalid(false);
  rango.setDataValidation(regla.build());
  if (v.fecha) rango.setNumberFormat('yyyy-mm-dd');
  if (v.mes) rango.setNumberFormat('yyyy-mm');
  if (v.numero) rango.setNumberFormat('#,##0.##');
}
