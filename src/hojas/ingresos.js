/**
 * Pestaña Ingresos: fila 3 con la tasa para planear de la segunda moneda, una fila por fuente desde la 4,
 * dos columnas por mes desde la D y, a la derecha, la tabla de cambios de moneda.
 */

const PRIMERA_COLUMNA_INGRESOS = 4;
const COLUMNA_CAMBIOS = PRIMERA_COLUMNA_INGRESOS + 2 * CONFIG.MESES + 1;
const FILAS_CAMBIOS = 100;

/** Tasa real del mes i: promedio ponderado de los cambios de ese mes (vacía si no hay). */
function formulaTasaReal(i) {
  const L = (k) => letra(COLUMNA_CAMBIOS + k);
  const desde = `">="&DATE(CfgAno,CfgMesInicio+${i},1)`;
  const hasta = `"<"&DATE(CfgAno,CfgMesInicio+${i + 1},1)`;
  const col = (k) => `$${L(k)}$3:$${L(k)}`;
  const suma = (k) => `SUMIFS(${col(k)},${col(0)},${desde},${col(0)},${hasta},${col(3)},"<>")`;
  return `=IFERROR(${suma(4)}/${suma(2)},"")`;
}

/** Diseño de Ingresos; sin `datos`, las filas quedan vacías con sus fórmulas. */
function disenoIngresos(datos) {
  const f0 = CONFIG.FILA_DATOS;
  const fuentes = datos ? datos.ingresos : [];
  const tasaPlan = datos ? datos.tasaPlan : [];
  const claves = Object.keys(CONFIG.COLUMNAS.ingresos);
  const filas = [['=IF(CfgUsarSegunda,"Tasa para planear","")', '', '=IF(CfgUsarSegunda,CfgSegundaMoneda,"")']];
  const celdas = [];
  for (let i = 0; i < CONFIG.MESES; i++) {
    const cp = columnaMes(PRIMERA_COLUMNA_INGRESOS, i, 'presupuesto');
    const previa = letra(cp - 2);
    const tasa = tasaPlan[i];
    if (tasa !== undefined && tasa !== null) celdas.push({ fila: f0, columna: cp, valor: tasa });
    else if (i > 0) celdas.push({ fila: f0, columna: cp, formula: `=IF(${previa}${f0}="","",${previa}${f0})` });
    celdas.push({ fila: f0, columna: cp + 1, formula: formulaTasaReal(i) });
  }
  for (let k = 0; k < CONFIG.FILAS_INGRESOS; k++) {
    const fila = f0 + 1 + k;
    const f = fuentes[k];
    filas.push(claves.map((c) => (f ? f[c] : '')));
    for (let i = 0; i < CONFIG.MESES; i++) {
      const cp = columnaMes(PRIMERA_COLUMNA_INGRESOS, i, 'presupuesto');
      const [presupuesto, real] = (f && f.meses[i]) || [null, null];
      if (presupuesto !== null) celdas.push({ fila, columna: cp, valor: presupuesto });
      else if (i > 0) celdas.push({ fila, columna: cp, formula: `=IF(AND($A${fila}<>"",CfgCopiar),${letra(cp - 2)}${fila},"")` });
      if (real !== null) celdas.push({ fila, columna: cp + 1, valor: real });
    }
  }
  const { ano, mesInicio } = (datos ? datos.config : CONFIG.DEFECTOS).general;
  return {
    encabezados: Object.values(CONFIG.COLUMNAS.ingresos),
    separador: CONFIG.PALETA.primary,
    filas,
    celdas,
    validaciones: [{ columna: 2, lista: 'ListaPersonas' }, { columna: 3, lista: 'ListaMonedas' }],
    cambios: {
      columna: COLUMNA_CAMBIOS,
      encabezados: Object.values(CONFIG.COLUMNAS.cambios),
      formulasEncabezado: Object.values(CONFIG.COLUMNAS.cambios).map((t) => `=IF(CfgUsarSegunda,"${t}","")`),
      filas: (datos ? datos.cambios : []).map((c) => {
        const [y, mm, dd] = (c.fecha || '').split('-').map(Number);
        return [new Date(ano, mesInicio - 1 + c.mes, 1), c.fecha ? new Date(y, mm - 1, dd) : '', c.dolares, c.tasa];
      }),
      formulaPesos: (fila) => {
        const [dl, ts] = [letra(COLUMNA_CAMBIOS + 2), letra(COLUMNA_CAMBIOS + 3)];
        return `=IF(AND(ISNUMBER(${dl}${fila}),ISNUMBER(${ts}${fila})),${dl}${fila}*${ts}${fila},"")`;
      },
    },
  };
}

/** Escribe Ingresos. Requiere Configuración y _Listas. */
function construirIngresos(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.ingresos);
  const P = CONFIG.PALETA;
  const f0 = CONFIG.FILA_DATOS;
  const diseno = disenoIngresos(datos);
  asegurarColumnas(sh, COLUMNA_CAMBIOS + diseno.cambios.encabezados.length - 1);
  escribirGrilla(ss, sh, diseno, PRIMERA_COLUMNA_INGRESOS);
  sh.getRange(f0, 1, 1, PRIMERA_COLUMNA_INGRESOS + 2 * CONFIG.MESES - 1).setBackground(P.ground).setFontStyle('italic');

  const c = diseno.cambios;
  const ancho = c.encabezados.length;
  sh.getRange(1, c.columna).setFormula('=IF(CfgUsarSegunda,"Cambios de moneda","")').setFontWeight('bold');
  sh.getRange(2, c.columna, 1, ancho).setFormulas([c.formulasEncabezado]).setBackground(P.deep).setFontColor(P.ground).setFontWeight('bold');
  if (c.filas.length) sh.getRange(f0, c.columna, c.filas.length, 4).setValues(c.filas);
  sh.getRange(f0, c.columna + 4, FILAS_CAMBIOS, 1)
    .setFormulas(Array.from({ length: FILAS_CAMBIOS }, (_, k) => [c.formulaPesos(f0 + k)]));
  sh.getRange(f0, c.columna, FILAS_CAMBIOS, 1).setNumberFormat('mmmm yyyy').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(ss.getRangeByName('ListaMesesAno'), true).build());
  sh.getRange(f0, c.columna + 1, FILAS_CAMBIOS, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(f0, c.columna + 2, FILAS_CAMBIOS, 2).setNumberFormat('#,##0.00');
  sh.getRange(f0, c.columna + 4, FILAS_CAMBIOS, 1).setNumberFormat('#,##0');
  sh.getRange(1, c.columna, f0 + FILAS_CAMBIOS, ancho).setFontFamily('Bricolage Grotesque').setFontSize(10);
}
