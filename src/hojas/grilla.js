/**
 * Utilidades de las grillas anuales (Gastos e Ingresos): fila 1 con los meses, fila 2 con Presup. / Real,
 * columnas fijas a la izquierda y dos columnas por mes desde `primera`.
 */

/** Número de columna (1 = A) a letra. */
function letra(n) {
  let s = '';
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
}

function columnaMes(primera, i, cual) {
  return primera + 2 * i + (cual === 'real' ? 1 : 0);
}

function formulaEncabezadoMes(i) {
  return `=DATE(CfgAno,CfgMesInicio+${i},1)`;
}

/** Agrega columnas al final de la hoja hasta tener al menos `n` (una hoja nueva trae 26). */
function asegurarColumnas(sh, n) {
  const actuales = sh.getMaxColumns();
  if (actuales < n) sh.insertColumnsAfter(actuales, n - actuales);
}

/** Bloque de celdas de los meses como matriz para setValues (las fórmulas empiezan con "="). */
function matrizMeses(celdas, primera, filaInicial, filas) {
  const m = Array.from({ length: filas }, () => Array(2 * CONFIG.MESES).fill(''));
  for (const c of celdas) m[c.fila - filaInicial][c.columna - primera] = c.formula || c.valor;
  return m;
}

/**
 * Escribe encabezados, columnas fijas, meses, validaciones y formato común de una grilla.
 * `diseno` = { encabezados, filas, celdas, validaciones }.
 */
function escribirGrilla(ss, sh, diseno, primera) {
  const P = CONFIG.PALETA;
  const f0 = CONFIG.FILA_DATOS;
  const filas = diseno.filas.length;
  const fijas = diseno.encabezados.length;
  const ultimaCol = primera + 2 * CONFIG.MESES - 1;
  asegurarColumnas(sh, ultimaCol);

  sh.getRange(2, 1, 1, fijas).setValues([diseno.encabezados]);
  for (let i = 0; i < CONFIG.MESES; i++) {
    const c = columnaMes(primera, i, 'presupuesto');
    sh.getRange(1, c, 1, 2).merge().setFormula(formulaEncabezadoMes(i)).setNumberFormat('mmmm yyyy').setHorizontalAlignment('center');
    sh.getRange(2, c, 1, 2).setValues([['Presup.', 'Real']]);
  }
  sh.getRange(1, 1, 1, ultimaCol).setBackground(P.primary).setFontColor(P.surface).setFontWeight('bold');
  sh.getRange(2, 1, 1, ultimaCol).setBackground(P.deep).setFontColor(P.ground).setFontWeight('bold');
  sh.getRange(2, primera, 1, 2 * CONFIG.MESES).setHorizontalAlignment('right');

  sh.getRange(f0, 1, filas, fijas).setValues(diseno.filas);
  sh.getRange(f0, primera, filas, 2 * CONFIG.MESES)
    .setValues(matrizMeses(diseno.celdas, primera, f0, filas)).setNumberFormat('#,##0');

  for (const v of diseno.validaciones) {
    const b = SpreadsheetApp.newDataValidation();
    if (v.lista) b.requireValueInRange(ss.getRangeByName(v.lista), true);
    else if (v.valores) b.requireValueInList(v.valores, true);
    else b.requireFormulaSatisfied(v.formula);
    sh.getRange(f0, v.columna, filas, 1).setDataValidation(b.setAllowInvalid(Boolean(v.soloAviso)).build());
  }

  sh.getRange(1, 1, f0 + filas, ultimaCol).setFontFamily('Bricolage Grotesque').setFontSize(10);
  sh.setFrozenRows(2);
  sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 170);
  sh.getRange(1, 1, 2, ultimaCol).protect().setDescription('Encabezados de la grilla').setWarningOnly(true);
}
