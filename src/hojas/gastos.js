/**
 * Pestaña Gastos: una fila por gasto o parte, las columnas fijas de CONFIG.COLUMNAS.gastos y dos columnas por
 * mes (Presup. y Real) a continuación.
 */

const PRIMERA_COLUMNA_GASTOS = Object.keys(CONFIG.COLUMNAS.gastos).length + 1;

/** Número de una columna fija de Gastos según el orden de CONFIG.COLUMNAS.gastos. */
function columnaGastos(clave) {
  return Object.keys(CONFIG.COLUMNAS.gastos).indexOf(clave) + 1;
}

/** Letra de una columna fija de Gastos. */
function letraGastos(clave) {
  return letra(columnaGastos(clave));
}

/**
 * Presupuesto de una celda: si el gasto tiene partes, la suma de sus partes sin contar la fila propia;
 * si no, la copia del mes anterior (o vacío en el primer mes). El Panel no lee esta celda en los gastos
 * con partes: recalcula la suma.
 */
function formulaPresupuestoGasto(fila, col, colPrevia) {
  const a = `$${letraGastos('gasto')}${fila}`;
  const pd = letraGastos('parteDe');
  const arriba = `$${pd}$2:$${pd}${fila - 1}`;
  const abajo = `$${pd}${fila + 1}:$${pd}`;
  const sinPartes = colPrevia ? `IF(CfgCopiar,${colPrevia}${fila},"")` : '""';
  return `=IF(${a}="","",IF(COUNTIF(${arriba},${a})+COUNTIF(${abajo},${a})>0,` +
    `SUMIF(${arriba},${a},${col}$2:${col}${fila - 1})+SUMIF(${abajo},${a},${col}${fila + 1}:${col}),${sinPartes}))`;
}

/** Diseño de Gastos; sin `datos`, las filas quedan vacías con sus fórmulas. */
function disenoGastos(datos) {
  const claves = Object.keys(CONFIG.COLUMNAS.gastos);
  const pd = letraGastos('parteDe');
  const gastos = datos ? datos.gastos : [];
  const filas = [];
  const celdas = [];
  for (let k = 0; k < CONFIG.FILAS_GASTOS; k++) {
    const g = gastos[k];
    const fila = CONFIG.FILA_DATOS + k;
    filas.push(claves.map((c) => (g && g[c] !== undefined ? g[c] : '')));
    for (let i = 0; i < CONFIG.MESES; i++) {
      const cp = columnaMes(PRIMERA_COLUMNA_GASTOS, i, 'presupuesto');
      const [presupuesto, real] = (g && g.meses[i]) || [null, null];
      celdas.push(presupuesto !== null
        ? { fila, columna: cp, valor: presupuesto }
        : { fila, columna: cp, formula: formulaPresupuestoGasto(fila, letra(cp), i > 0 ? letra(cp - 2) : null) });
      if (real !== null) celdas.push({ fila, columna: cp + 1, valor: real });
    }
  }
  return {
    encabezados: Object.values(CONFIG.COLUMNAS.gastos),
    filas,
    celdas,
    validaciones: [
      { columna: columnaGastos('gasto'), formula: `=COUNTIFS($A$3:$A,$A3,$${pd}$3:$${pd},"")<=1`, soloAviso: true },
      { columna: columnaGastos('grupo'), lista: 'ListaGrupos' },
      { columna: columnaGastos('parteDe'), lista: 'ListaGastosPadre' },
      { columna: columnaGastos('tipo'), lista: 'ListaTipos' },
      { columna: columnaGastos('comportamiento'), valores: ['fijo', 'variable'] },
      { columna: columnaGastos('persona'), lista: 'ListaPersonas' },
      { columna: columnaGastos('pago'), lista: 'ListaFormasPago' },
    ],
  };
}

/**
 * Encabezado y código de la forma de pago de cada fila: va en la fila de encabezados (protegida) y derrama
 * sobre el rango abierto de Gastos, así borrar u ordenar filas de datos no lo quita.
 */
function formulaCodigoPago() {
  const fp = `$${letraGastos('pago')}$${CONFIG.FILA_DATOS}:$${letraGastos('pago')}`;
  return `={"${CONFIG.COLUMNAS.gastos.codigo}";MAP(${fp},LAMBDA(fp,IF(fp="","",` +
    'LET(cd,XLOOKUP(fp,CfgFormasPagoNombre,CfgFormasPagoCodigo,""),IF(cd="",LEFT(fp,1),cd)))))}';
}

/** Condición de la regla del tono `nombre`: la forma de pago de la fila tiene ese color en Configuración. */
function formulaColorPago(nombre) {
  return `=XLOOKUP($${letraGastos('pago')}${CONFIG.FILA_DATOS},INDIRECT("CfgFormasPagoNombre"),` +
    `INDIRECT("CfgFormasPagoColor"),"")="${nombre}"`;
}

/**
 * Reglas de formato de Gastos en orden de prioridad: gris del Real de las partes, negrita del gasto padre y
 * un tono por color de la paleta de pago (columna del código y meses). Rangos en A1.
 */
function reglasGastos() {
  const f0 = CONFIG.FILA_DATOS;
  const u = f0 + CONFIG.FILAS_GASTOS - 1;
  const pd = letraGastos('parteDe');
  const ultima = letra(PRIMERA_COLUMNA_GASTOS + 2 * CONFIG.MESES - 1);
  const columna = (n) => `${letra(n)}${f0}:${letra(n)}${u}`;
  const reales = Array.from({ length: CONFIG.MESES }, (_, i) => columna(columnaMes(PRIMERA_COLUMNA_GASTOS, i, 'real')));
  const tenidos = [columna(columnaGastos('codigo')), `${letra(PRIMERA_COLUMNA_GASTOS)}${f0}:${ultima}${u}`];
  return [
    { formula: `=$${pd}${f0}<>""`, fondo: CONFIG.PALETA.line, rangos: reales },
    { formula: `=COUNTIF($${pd}$${f0}:$${pd},$A${f0})>0`, negrita: true, rangos: [`A${f0}:${ultima}${u}`] },
    ...CONFIG.PALETA_PAGO.map(([nombre, hex]) => ({ formula: formulaColorPago(nombre), fondo: hex, rangos: tenidos })),
  ];
}

/** Escribe Gastos. Requiere Configuración y _Listas. */
function construirGastos(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.gastos);
  const P = CONFIG.PALETA;
  const f0 = CONFIG.FILA_DATOS;
  const filas = CONFIG.FILAS_GASTOS;
  const primera = PRIMERA_COLUMNA_GASTOS;
  escribirGrilla(ss, sh, disenoGastos(datos), primera, 2);
  sh.getRange(f0 - 1, columnaGastos('codigo')).setFormula(formulaCodigoPago());

  sh.setConditionalFormatRules(reglasGastos().map((r) => {
    const regla = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(r.formula)
      .setRanges(r.rangos.map((a1) => sh.getRange(a1)));
    if (r.fondo) regla.setBackground(r.fondo);
    if (r.negrita) regla.setBold(true);
    return regla.build();
  }));
  sh.getRange(f0, columnaGastos('parteDe'), filas, 1).setFontColor(P.muted);
  sh.setColumnWidth(columnaGastos('codigo'), 34);
  sh.getRange(f0, columnaGastos('codigo'), filas, 1).setHorizontalAlignment('center').setFontWeight('bold');
}
