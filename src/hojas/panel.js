/**
 * Pestaña Panel: resumen del mes elegido. Las fórmulas reproducen las reglas de calcularPanel (oraculo.js).
 * Se escriben en sintaxis en_US: el generador construye la planilla con esa configuración regional.
 */

const FILA_TABLA = 9;
const FILAS_TABLA = 100;
const ULTIMA_FILA_TABLA = FILA_TABLA + FILAS_TABLA - 1;

/** Fragmentos LET comunes: inicio y fin del mes elegido y conversión a moneda principal. */
const LET_MES = 'mIni, PanelMesInicio, mFin, EDATE(mIni, 1), ' +
  'conv, LAMBDA(x, y, IF(OR(y="", y=MonedaPrincipal), x, x*IFERROR(INDEX(FILTER(CfgTasasTasa, ' +
  'CfgTasasMoneda=y, CfgTasasMes>=mIni, CfgTasasMes<mFin), 1), NA()))), ';

function formulaMesInicio() {
  return '=IF(ISNUMBER(PanelMes), DATE(YEAR(PanelMes), MONTH(PanelMes), 1), ' +
    'IF(OR(PanelMes="", PanelMes="Mes actual"), DATE(YEAR(TODAY()), MONTH(TODAY()), 1), ' +
    'DATE(VALUE(LEFT(PanelMes, 4)), VALUE(RIGHT(PanelMes, 2)), 1)))';
}

function formulaDiaDelMes() {
  return '=LET(mIni, PanelMesInicio, hoy, TODAY(), IF(mIni>hoy, "Mes futuro", IF(EDATE(mIni, 1)<=hoy, "Mes cerrado", ' +
    '"Día "&DAY(hoy)&" de "&DAY(EOMONTH(hoy, 0)))))';
}

function formulaIngresos() {
  return `=ARRAYFORMULA(LET(${LET_MES}` +
    'ok, {(IngFecha>=mIni)*(IngFecha<mFin)*ISNUMBER(IngMonto); 1}, ' +
    'SUM(MAP(FILTER({IngMonto; 0}, ok), FILTER({IngMoneda; ""}, ok), conv))))';
}

/** Tabla por categoría: Grupo, Categoría, Presupuesto, Gastado, Avance, Estado, Según compras. */
function formulaTabla() {
  return `=ARRAYFORMULA(LET(${LET_MES}hoy, TODAY(), ` +
    'fr, IF(mFin<=hoy, 1, IF(mIni>hoy, 0, DAY(hoy)/DAY(EOMONTH(hoy, 0)))), ' +
    'ok, {(MovFecha>=mIni)*(MovFecha<mFin)*ISNUMBER(MovMonto); 1}, ' +
    'mSub, FILTER({MovSubcategoria; ""}, ok), ' +
    'mVal, MAP(FILTER({MovMonto; 0}, ok), FILTER({MovMoneda; ""}, ok), conv), ' +
    'mMig, FILTER({MovOrigen; ""}, ok)="migrado", ' +
    `subs, CfgSubcategoriasCategoria&"${CONFIG.SEPARADOR}"&CfgSubcategoriasSubcategoria, ` +
    `mCat, MAP(mSub, LAMBDA(s, IFERROR(INDEX(FILTER(CfgSubcategoriasCategoria, subs=s), 1), "${SIN_CATEGORIA}"))), ` +
    'cOk, CfgCategoriasCategoria<>"", ' +
    `cats, {FILTER(CfgCategoriasCategoria, cOk); "${SIN_CATEGORIA}"}, ` +
    'grupos, {FILTER(CfgCategoriasGrupo, cOk); ""}, ' +
    'activas, {FILTER(CfgCategoriasActiva, cOk); FALSE}, ' +
    'comps, {FILTER(CfgCategoriasComportamiento, cOk); "variable"}, ' +
    'g, MAP(cats, LAMBDA(c, SUMPRODUCT((mCat=c)*mVal))), ' +
    'r, MAP(cats, LAMBDA(c, SUMPRODUCT((mCat=c)*(1-mMig)*mVal))), ' +
    'p, MAP(cats, LAMBDA(c, IFERROR(INDEX(FILTER(AjusteMonto, AjusteCategoria=c, AjusteMes>=mIni, AjusteMes<mFin), 1), ' +
    'IFERROR(INDEX(SORT(FILTER({PresBaseVigenteDesde, PresBaseMonto}, PresBaseCategoria=c, ' +
    'ISNUMBER(PresBaseVigenteDesde), PresBaseVigenteDesde<mFin), 1, FALSE), 1, 2), 0)))), ' +
    'est, MAP(comps, p, g, r, LAMBDA(cm, pp, gg, rr, IF(gg>pp, "Excedido", IF(cm="fija", ' +
    'IF(gg=0, "Pendiente", IF(gg<pp, "Pago parcial", "Pagado")), IF(AND(gg>0, rr=0), "Pagado", ' +
    `IF(pp>0, IF(rr/pp>fr+${TOLERANCIA_RITMO}, "Va rápido", "En ritmo"), "En ritmo")))))), ` +
    'av, MAP(p, g, LAMBDA(pp, gg, IF(pp>0, gg/pp, 0))), ' +
    'k, (YEAR(mIni)*12+MONTH(mIni))-(YEAR(TarFecha)*12+MONTH(TarFecha)), ' +
    'sc, MAP(cats, LAMBDA(c, LET(t, IFERROR(INDEX(FILTER(CfgTarjetasTarjeta, CfgTarjetasCategoriaPago=c), 1), ""), ' +
    'IF(t="", "", SUMPRODUCT((TarTarjeta=t)*ISNUMBER(TarMonto)*(k>=1)*(k<=TarCuotas)*IFERROR(TarMonto/TarCuotas, 0)))))), ' +
    'FILTER({grupos, cats, p, g, av, est, sc}, (activas=TRUE)+(g<>0))))';
}

/** Reparto por tipo E/A/I/N: Tipo, Gastado, % del ingreso, Meta. Lee la tabla del Panel. */
function formulaTipos() {
  const f = FILA_TABLA;
  return '=ARRAYFORMULA(LET(ing, PanelIngresos, okT, CfgMetasTipo<>"", t, FILTER(CfgMetasTipo, okT), ' +
    'meta, FILTER(CfgMetasPct, okT), ' +
    `tipoCat, XLOOKUP(B${f}:B${ULTIMA_FILA_TABLA}, CfgCategoriasCategoria, CfgCategoriasTipo, ""), ` +
    `g, MAP(t, LAMBDA(x, SUMPRODUCT((tipoCat=x)*D${f}:D${ULTIMA_FILA_TABLA}))), ` +
    '{XLOOKUP(t, {"E"; "A"; "I"; "N"}, {"Esenciales"; "Ahorro"; "Inversión"; "No esenciales"}, t), g, ' +
    'IF(ing<>0, g/ing, g*0), meta}))';
}

function formulaBarra(fila) {
  const { primary, warn } = CONFIG.PALETA;
  return `=IF(B${fila}="", "", SPARKLINE(MIN(E${fila}, 1), {"charttype", "bar"; "max", 1; ` +
    `"color1", IF(E${fila}>1, "${warn}", "${primary}")}))`;
}

/** Celdas del Panel: posición, rango con nombre, fórmula o valor y, en el selector, su lista. */
function disenoPanel() {
  const f = FILA_TABLA;
  const celdas = [
    { a1: 'A1', valor: 'Presupuesto familiar' },
    { a1: 'E1', valor: 'Mes' },
    { a1: 'F1', nombre: 'PanelMes', valor: 'Mes actual', lista: 'ListaMeses' },
    { a1: 'G1', nombre: 'PanelMesInicio', formula: formulaMesInicio() },
    { a1: 'H1', formula: formulaDiaDelMes() },
    { a1: 'A3', valor: 'Ingresos del mes' },
    { a1: 'C3', valor: 'Presupuestado' },
    { a1: 'E3', valor: 'Gastado' },
    { a1: 'G3', valor: 'Disponible (ingresos − gastado)' },
    { a1: 'A4', nombre: 'PanelIngresos', formula: formulaIngresos() },
    { a1: 'C4', nombre: 'PanelPresupuestado', formula: `=SUM(C${f}:C${ULTIMA_FILA_TABLA})` },
    { a1: 'E4', nombre: 'PanelGastado', formula: `=SUM(D${f}:D${ULTIMA_FILA_TABLA})` },
    { a1: 'G4', nombre: 'PanelDisponible', formula: '=PanelIngresos-PanelGastado' },
    { a1: 'A5', valor: 'Sin asignar (ingresos − presupuestado)' },
    { a1: 'C5', nombre: 'PanelSinAsignar', formula: '=PanelIngresos-PanelPresupuestado' },
    { a1: 'A7', valor: 'Por categoría' },
    { a1: 'J7', valor: 'Reparto E / A / I / N contra su meta' },
    { a1: `A${f}`, nombre: 'PanelTabla', formula: formulaTabla() },
    { a1: `J${f}`, nombre: 'PanelTipos', formula: formulaTipos() },
  ];
  ['Grupo', 'Categoría', 'Presupuesto', 'Gastado', 'Avance', 'Estado', 'Según compras', 'Avance del mes']
    .forEach((valor, i) => celdas.push({ a1: `${String.fromCharCode(65 + i)}${f - 1}`, valor }));
  ['Tipo', 'Gastado', '% del ingreso', 'Meta']
    .forEach((valor, i) => celdas.push({ a1: `${String.fromCharCode(74 + i)}${f - 1}`, valor }));
  for (let fila = f; fila <= ULTIMA_FILA_TABLA; fila++) celdas.push({ a1: `H${fila}`, formula: formulaBarra(fila) });
  return { celdas };
}

/** Escribe el Panel con el formato del boceto aprobado. Requiere las pestañas de datos y _Listas. */
function construirPanel(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.panel);
  const P = CONFIG.PALETA;
  const f = FILA_TABLA;
  const u = ULTIMA_FILA_TABLA;

  sh.getRange('A1:M120').setFontFamily('Bricolage Grotesque').setFontColor(P.ink).setFontSize(10);
  sh.setHiddenGridlines(true);
  sh.getRange('F1').setNumberFormat('@');

  for (const c of disenoPanel().celdas) {
    const r = sh.getRange(c.a1);
    if (c.formula) r.setFormula(c.formula); else r.setValue(c.valor);
    if (c.nombre) ss.setNamedRange(c.nombre, r);
    if (c.lista) {
      r.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInRange(ss.getRangeByName(c.lista), true).setAllowInvalid(false).build());
    }
  }

  sh.getRange('A1:M1').setBackground(P.deep).setFontColor(P.ground);
  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('F1').setBackground(P.surface).setFontColor(P.ink).setFontWeight('bold');
  sh.getRange('G1').setNumberFormat('mmmm yyyy');
  sh.setRowHeight(1, 36);
  sh.getRange('A1:M1').setVerticalAlignment('middle');

  for (const par of ['A3:B3', 'C3:D3', 'E3:F3', 'G3:H3', 'A4:B4', 'C4:D4', 'E4:F4', 'G4:H4']) sh.getRange(par).merge();
  sh.getRange('A3:H3').setFontColor(P.muted).setFontSize(9);
  sh.getRange('A4:H4').setFontSize(16).setFontWeight('bold').setNumberFormat('#,##0').setHorizontalAlignment('left');
  sh.getRange('A3:H4').setBorder(true, true, true, true, true, false, P.line, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('G3:H4').setBackground(P.primary).setFontColor(P.surface);
  sh.getRange('A5').setFontColor(P.muted);
  sh.getRange('C5').setNumberFormat('#,##0').setFontColor(P.muted);

  sh.getRange('A7:J7').setFontColor(P.primary).setFontWeight('bold').setFontSize(11);
  sh.getRange(`A${f - 1}:M${f - 1}`).setFontColor(P.muted).setFontWeight('bold')
    .setBorder(null, null, true, null, null, null, P.line, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.getRange(`I${f - 1}`).setBorder(null, null, false, null, null, null);
  sh.getRange(`C${f}:D${u}`).setNumberFormat('#,##0');
  sh.getRange(`G${f}:G${u}`).setNumberFormat('#,##0');
  sh.getRange(`E${f}:E${u}`).setNumberFormat('0%');
  sh.getRange(`K${f}:K${f + 10}`).setNumberFormat('#,##0');
  sh.getRange(`L${f}:M${f + 10}`).setNumberFormat('0%');
  sh.getRange(`C${f - 1}:E${u}`).setHorizontalAlignment('right');
  sh.getRange(`G${f - 1}:G${u}`).setHorizontalAlignment('right');
  sh.getRange(`K${f - 1}:M${f + 10}`).setHorizontalAlignment('right');
  sh.getRange(`F${f}:F${u}`).setFontWeight('bold');

  const estados = sh.getRange(`F${f}:F${u}`);
  const regla = (texto, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(texto).setFontColor(color).setRanges([estados]).build();
  sh.setConditionalFormatRules([
    ...['Excedido', 'Va rápido'].map((t) => regla(t, P.warn)),
    ...['Pagado', 'En ritmo'].map((t) => regla(t, P.primary)),
    ...['Pendiente', 'Pago parcial'].map((t) => regla(t, P.muted)),
  ]);

  [130, 170, 110, 110, 70, 110, 120, 150, 24, 120, 110, 100, 80].forEach((ancho, i) => sh.setColumnWidth(i + 1, ancho));
  sh.setFrozenRows(1);
  sh.protect().setDescription('Panel: solo el selector de mes es editable').setWarningOnly(true);
}
