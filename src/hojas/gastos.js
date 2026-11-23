/** Pestaña Gastos: una fila por gasto o parte, dos columnas por mes (Presup. y Real) desde la columna H. */

const PRIMERA_COLUMNA_GASTOS = 8;

/**
 * Presupuesto de una celda: si el gasto tiene partes, la suma de sus partes sin contar la fila propia;
 * si no, la copia del mes anterior (o vacío en el primer mes). El Panel no lee esta celda en los gastos
 * con partes: recalcula la suma.
 */
function formulaPresupuestoGasto(fila, col, colPrevia) {
  const a = `$A${fila}`;
  const arriba = `$C$2:$C${fila - 1}`;
  const abajo = `$C${fila + 1}:$C`;
  const sinPartes = colPrevia ? `IF(CfgCopiar,${colPrevia}${fila},"")` : '""';
  return `=IF(${a}="","",IF(COUNTIF(${arriba},${a})+COUNTIF(${abajo},${a})>0,` +
    `SUMIF(${arriba},${a},${col}$2:${col}${fila - 1})+SUMIF(${abajo},${a},${col}${fila + 1}:${col}),${sinPartes}))`;
}

/** Diseño de Gastos; sin `datos`, las filas quedan vacías con sus fórmulas. */
function disenoGastos(datos) {
  const claves = Object.keys(CONFIG.COLUMNAS.gastos);
  const gastos = datos ? datos.gastos : [];
  const filas = [];
  const celdas = [];
  for (let k = 0; k < CONFIG.FILAS_GASTOS; k++) {
    const g = gastos[k];
    const fila = CONFIG.FILA_DATOS + k;
    filas.push(claves.map((c) => (g ? g[c] : '')));
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
      { columna: 1, formula: '=COUNTIFS($A$3:$A,$A3,$C$3:$C,"")<=1', soloAviso: true },
      { columna: 2, lista: 'ListaGrupos' },
      { columna: 3, lista: 'ListaGastosPadre' },
      { columna: 4, lista: 'ListaTipos' },
      { columna: 5, valores: ['fijo', 'variable'] },
      { columna: 6, lista: 'ListaPersonas' },
      { columna: 7, lista: 'ListaFormasPago' },
    ],
  };
}

/** Escribe Gastos. Requiere Configuración y _Listas. */
function construirGastos(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.gastos);
  const P = CONFIG.PALETA;
  const f0 = CONFIG.FILA_DATOS;
  const filas = CONFIG.FILAS_GASTOS;
  const primera = PRIMERA_COLUMNA_GASTOS;
  escribirGrilla(ss, sh, disenoGastos(datos), primera);

  const reales = Array.from({ length: CONFIG.MESES }, (_, i) => sh.getRange(f0, columnaMes(primera, i, 'real'), filas, 1));
  const todo = sh.getRange(f0, 1, filas, primera + 2 * CONFIG.MESES - 1);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=$C${f0}<>""`)
      .setBackground(P.line).setRanges(reales).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=COUNTIF($C$${f0}:$C,$A${f0})>0`)
      .setBold(true).setRanges([todo]).build(),
  ]);
  sh.getRange(f0, 3, filas, 1).setFontColor(P.muted);
}
