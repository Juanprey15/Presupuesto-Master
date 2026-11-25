/**
 * Pestaña Panel: resumen del mes elegido. Las fórmulas reproducen las reglas de calcularMes y
 * calcularFormaPago (oraculo.js) y se escriben en sintaxis en_US.
 */

const FILA_TABLA = 25;
const FILAS_TABLA = CONFIG.FILAS_GASTOS;
const ULTIMA_FILA_TABLA = FILA_TABLA + FILAS_TABLA - 1;
const MESES_CONSTANTE = `{${Array.from({ length: CONFIG.MESES }, (_, k) => k).join(';')}}`;

/**
 * Variables LET comunes sobre Gastos para el mes `indice`: columnas, presupuesto y real del mes, y las
 * marcas de cada fila (parte de un gasto existente, gasto con partes, gasto propio).
 */
function letGastos(indice) {
  const col = (clave) => `Gastos!$${letraGastos(clave)}$3:$${letraGastos(clave)}`;
  const meses = `Gastos!$${letra(PRIMERA_COLUMNA_GASTOS)}$3:$${letra(PRIMERA_COLUMNA_GASTOS + 2 * CONFIG.MESES - 1)}`;
  return `i,${indice},nm,${col('gasto')},gr,${col('grupo')},pd,${col('parteDe')},tp,${col('tipo')},` +
    `cm,${col('comportamiento')},pe,${col('persona')},pg,${col('pago')},` +
    `pr,INDEX(${meses},0,2*i+1),rr,INDEX(${meses},0,2*i+2),` +
    'pp,IF(ISNUMBER(pr),pr,0),re,IF(ISNUMBER(rr),rr,0),hay,ISNUMBER(rr),tops,IF(pd="",nm,""),' +
    'parte,(pd<>"")*ISNUMBER(MATCH(pd,tops,0)),padre,(nm<>"")*(pd="")*ISNUMBER(MATCH(nm,pd,0)),' +
    'propio,(nm<>"")*(1-parte),';
}

/** Personas de Configuración (todas, con su casilla de activa) para filtrar las visibles. */
const LET_PERSONAS = 'okp,CfgPersonasNombre<>"",per,FILTER(CfgPersonasNombre,okp),act,FILTER(CfgPersonasActiva,okp),';

function formulaIndice() {
  return '=LET(sel,IF(OR(PanelMes="",PanelMes="Mes actual"),TODAY(),PanelMes),' +
    'k,(YEAR(sel)-CfgAno)*12+MONTH(sel)-CfgMesInicio,MIN(MAX(k,0),11))';
}

function formulaFraccion() {
  return '=LET(ini,PanelMesInicio,fin,EDATE(ini,1),hoy,TODAY(),' +
    'IF(fin<=hoy,1,IF(ini>hoy,0,DAY(hoy)/DAY(EOMONTH(hoy,0)))))';
}

function formulaDia() {
  return '=IF(PanelFraccion=1,"Mes cerrado",IF(PanelFraccion=0,"Mes futuro","Día "&DAY(TODAY())&" de "&' +
    'DAY(EOMONTH(TODAY(),0))&": va "&ROUND(PanelFraccion*100)&" % del mes"))';
}

/** Tabla del mes: grupo, gasto, presupuestado, real, diferencia, avance, estado. */
function formulaTabla() {
  return `=ARRAYFORMULA(IFERROR(LET(${letGastos('PanelIndice')}fr,PanelFraccion,` +
    'fn,FILTER(nm,propio),fgr,FILTER(gr,propio),fcm,FILTER(cm,propio),fpa,FILTER(padre,propio),' +
    'fpp,FILTER(pp,propio),fre,FILTER(re,propio),fh,FILTER(hay,propio),sq,FILTER(ROW(nm),propio),' +
    'pres,MAP(fn,fpa,fpp,LAMBDA(nombre,espadre,valor,IF(espadre,SUMPRODUCT((pd=nombre)*parte*pp),valor))),' +
    'conocido,IF(fgr="",FALSE,ISNUMBER(MATCH(fgr,CfgGruposNombre,0))),' +
    'grp,IF(conocido,fgr,"Sin grupo"),ord,IF(conocido,XLOOKUP(fgr,CfgGruposNombre,CfgGruposOrden,1000000),1000000),' +
    'est,MAP(fcm,pres,fre,fh,LAMBDA(comp,pre,rea,tiene,IF(NOT(tiene),"Pendiente",IF(rea>pre,"Excedido",' +
    'IF(rea=pre,"Pagado",IF(comp<>"variable","Pago parcial",' +
    'IF(pre>0,IF(rea/pre>fr+CfgTolerancia,"Va rápido","En ritmo"),"En ritmo"))))))),' +
    'incl,(pres>0)+fh,' +
    'SORT(FILTER({grp,fn,pres,IF(fh,fre,""),pres-fre,IF(pres>0,fre/pres,0),est},incl>0),' +
    'FILTER(ord*100000+sq,incl>0),TRUE)),""))';
}

/** Ingresos del mes en una columna: planeado, real, hay real, tasa para planear, tasa real, USD por cambiar,
 *  diferencia por la tasa, falta la tasa, real de la segunda moneda en pesos, real en la segunda moneda. */
function formulaIngresosCalc() {
  return '=ARRAYFORMULA(LET(i,PanelIndice,ini,PanelMesInicio,fm,Ingresos!$C$4:$C,' +
    'pr,INDEX(Ingresos!$D$4:$AA,0,2*i+1),rr,INDEX(Ingresos!$D$4:$AA,0,2*i+2),' +
    'pp,IF(ISNUMBER(pr),pr,0),re,IF(ISNUMBER(rr),rr,0),usd,(fm=CfgSegundaMoneda)*(fm<>"")*CfgUsarSegunda,' +
    'tr,INDEX(Ingresos!$D$3:$AA,1,2*i+1),tieneTasa,ISNUMBER(tr),tasa,IF(tieneTasa,tr,0),' +
    'cmes,Ingresos!$AC$3:$AC,cd,Ingresos!$AE$3:$AE,ct,Ingresos!$AF$3:$AF,' +
    'ok,(cmes>=ini)*(cmes<EDATE(ini,1))*ISNUMBER(cd)*ISNUMBER(ct)*CfgUsarSegunda,dol,IF(ISNUMBER(cd),cd,0),tas,IF(ISNUMBER(ct),ct,0),' +
    'cambiados,SUMPRODUCT(ok*dol),pesos,SUMPRODUCT(ok*dol*tas),' +
    'usdPlan,SUMPRODUCT(usd*pp),usdReal,SUMPRODUCT(usd*re),' +
    'porCambiar,MAX(0,usdReal-cambiados),realUsd,pesos+porCambiar*tasa,' +
    'planeado,usdPlan*tasa+SUMPRODUCT((1-usd)*pp),real,realUsd+SUMPRODUCT((1-usd)*re),' +
    'tieneReal,SUMPRODUCT(ISNUMBER(rr)*1)>0,' +
    '{planeado;real;tieneReal;IF(tieneTasa,tr,"");IF(cambiados>0,pesos/cambiados,"");porCambiar;' +
    'realUsd-usdReal*tasa;AND(NOT(tieneTasa),usdPlan+usdReal>0);realUsd;usdReal}))';
}

const calc = (k) => `INDEX(PanelIngresosCalc,${k})`;

function formulaFormaPago() {
  return `=ARRAYFORMULA(IFERROR(LET(${letGastos('PanelIndice')}${LET_PERSONAS}fp,PanelFormaPago,` +
    'pre,MAP(per,LAMBDA(x,SUMPRODUCT((pe=x)*(pg=fp)*(nm<>"")*(1-padre)*pp))),' +
    'gas,MAP(per,LAMBDA(x,SUMPRODUCT((pe=x)*(pg=fp)*propio*(1-padre)*re))),' +
    'sinp,(pe="")+(COUNTIF(CfgPersonasNombre,pe)=0),' +
    'preS,SUMPRODUCT(sinp*(pg=fp)*(nm<>"")*(1-padre)*pp),gasS,SUMPRODUCT(sinp*(pg=fp)*propio*(1-padre)*re),' +
    'vis,(act=TRUE)+(pre<>0)+(gas<>0),' +
    'filas,FILTER({{per,pre,gas,pre-gas};{"Sin persona",preS,gasS,preS-gasS}},{vis>0;(preS<>0)+(gasS<>0)>0}),' +
    'totP,SUM(pre)+preS,totG,SUM(gas)+gasS,' +
    '{filas;{"Total",totP,totG,totP-totG}}),""))';
}

function formulaFormaPagoNota() {
  return `=ARRAYFORMULA(IFERROR(LET(${letGastos('PanelIndice')}fp,PanelFormaPago,` +
    'txt,TEXTJOIN(", ",TRUE,UNIQUE(FILTER(pd,parte,pg=fp))),IF(txt="","","Gastado sin contar: "&txt)),""))';
}

function formulaTipos() {
  return `=ARRAYFORMULA(IFERROR(LET(${letGastos('PanelIndice')}okt,CfgTiposLetra<>"",` +
    'letras,FILTER(CfgTiposLetra,okt),nombres,FILTER(CfgTiposNombre,okt),metas,FILTER(CfgTiposMeta,okt),ing,PanelIngresos,' +
    'real,MAP(letras,LAMBDA(x,SUMPRODUCT((tp=x)*propio*re))),' +
    '{letras,nombres,real,IF(ing<>0,real/ing,0),metas}),""))';
}

function formulaPersonas() {
  return `=ARRAYFORMULA(IFERROR(LET(${letGastos('PanelIndice')}${LET_PERSONAS}` +
    'fm,Ingresos!$C$4:$C,ipe,Ingresos!$B$4:$B,irr,INDEX(Ingresos!$D$4:$AA,0,2*i+2),ire,IF(ISNUMBER(irr),irr,0),' +
    'ipr,INDEX(Ingresos!$D$4:$AA,0,2*i+1),ipp,IF(ISNUMBER(ipr),ipr,0),' +
    `iusd,(fm=CfgSegundaMoneda)*(fm<>"")*CfgUsarSegunda,realUsd,${calc(9)},usdReal,${calc(10)},` +
    `hayIng,${calc(3)},tasa,IF(${calc(4)}="",0,${calc(4)}),` +
    'ing,MAP(per,LAMBDA(x,IF(hayIng,SUMPRODUCT((ipe=x)*(1-iusd)*ire)+IF(usdReal>0,realUsd*SUMPRODUCT((ipe=x)*iusd*ire)/usdReal,0),' +
    'SUMPRODUCT((ipe=x)*(1-iusd)*ipp)+tasa*SUMPRODUCT((ipe=x)*iusd*ipp)))),' +
    'pre,MAP(per,LAMBDA(x,SUMPRODUCT((pe=x)*(nm<>"")*(1-padre)*pp))),' +
    'FILTER({per,ing,pre,ing-pre},(act=TRUE)+(ing<>0)+(pre<>0))),""))';
}

/** Columna del gráfico del año: presupuestado o real por mes. */
function formulaAno(cual) {
  const suma = cual === 'presupuestado' ? 'SUMPRODUCT((nm<>"")*(1-padre)*pp)' : 'SUMPRODUCT(propio*re)';
  return `=ARRAYFORMULA(BYROW(${MESES_CONSTANTE},LAMBDA(k,LET(${letGastos('k')}${suma}))))`;
}

function formulaBarra(fila) {
  const { primary, warn } = CONFIG.PALETA;
  return `=IF(C${fila}="","",SPARKLINE(MIN(AG${fila},1),{"charttype","bar";"max",1;` +
    `"color1",IF(OR(H${fila}="Excedido",H${fila}="Va rápido"),"${warn}","${primary}")}))`;
}

/**
 * Celdas del Panel: posición, rango con nombre (y su tamaño), fórmula o valor y, en los selectores, su lista.
 * Lo visible sigue el boceto aprobado: cifras, gráfico del año y tabla en B:H; recuadros en J:N. Los cálculos viven en columnas
 * ocultas (Z: auxiliares; AB:AH: tabla del mes; AJ:AL: año) y las columnas visibles los muestran.
 */
function disenoPanel(datos) {
  const f = FILA_TABLA;
  const u = ULTIMA_FILA_TABLA;
  const formas = (datos ? datos.config : CONFIG.DEFECTOS).formasPago.filter((x) => x.activa);
  const { accent } = CONFIG.PALETA;
  const celdas = [
    { a1: 'B1', formula: '=CfgNombre' },
    { a1: 'B2', formula: '="Presupuesto "&CfgAno' },
    { a1: 'K1', valor: 'Mes' },
    { a1: 'L1', nombre: 'PanelMes', valor: 'Mes actual', lista: 'ListaMesesPanel' },
    { a1: 'B3', formula: `=SPARKLINE(PanelFraccion,{"charttype","bar";"max",1;"color1","${accent}"})` },
    { a1: 'B4', formula: formulaDia() },
    { a1: 'Z1', nombre: 'PanelIndice', formula: formulaIndice() },
    { a1: 'Z2', nombre: 'PanelMesInicio', formula: '=DATE(CfgAno,CfgMesInicio+PanelIndice,1)' },
    { a1: 'Z3', nombre: 'PanelFraccion', formula: formulaFraccion() },
    { a1: 'Z5', nombre: 'PanelIngresosCalc', filas: 10, formula: formulaIngresosCalc() },
    { a1: 'Z16', nombre: 'PanelPresupuestado', formula: `=SUM(AD${f}:AD)` },
    { a1: 'Z17', nombre: 'PanelSinAsignar', formula: `=${calc(1)}-PanelPresupuestado` },
    { a1: 'Z18', nombre: 'PanelSinAsignarEtiqueta', formula: '=IF(PanelSinAsignar<0,"Sobre-asignado","Sin asignar")' },

    { a1: 'B6', nombre: 'PanelIngresosEtiqueta', formula: `=IF(${calc(3)},"Ingresos","Ingresos (planeados)")` },
    { a1: 'B7', nombre: 'PanelIngresos', formula: `=IF(${calc(3)},${calc(2)},${calc(1)})` },
    { a1: 'D6', valor: 'Gastado hasta hoy' },
    { a1: 'D7', nombre: 'PanelGastado', formula: `=SUM(AE${f}:AE)` },
    { a1: 'F6', valor: 'Queda del presupuesto' },
    { a1: 'F7', nombre: 'PanelQueda', formula: '=PanelPresupuestado-PanelGastado' },
    { a1: 'B8', formula: '="Presupuestado "&TEXT(PanelPresupuestado,"#,##0")&". "&PanelSinAsignarEtiqueta&' +
      '" (ingresos menos presupuesto): "&TEXT(ABS(PanelSinAsignar),"#,##0")&"."' },

    { a1: 'B10', valor: 'El año de un vistazo' },
    { a1: `B${f - 2}`, valor: 'Presupuestado contra real' },
    { a1: `AB${f}`, nombre: 'PanelTabla', filas: FILAS_TABLA, columnas: 7, formula: formulaTabla() },
    { a1: `B${f}`, formula: `=ARRAYFORMULA(IF(AB${f}:AB${u}="","",IF(AB${f}:AB${u}=AB${f - 1}:AB${u - 1},"",AB${f}:AB${u})))` },
    { a1: `C${f}`, formula: `=ARRAYFORMULA(IF(AC${f}:AC${u}="","",AC${f}:AF${u}))` },
    { a1: `H${f}`, formula: `=ARRAYFORMULA(IF(AC${f}:AC${u}="","",AH${f}:AH${u}))` },

    { a1: 'J6', valor: 'Forma de pago' },
    { a1: 'L6', nombre: 'PanelFormaPago', valor: formas.length ? formas[0].nombre : '', lista: 'ListaFormasPago' },
    { a1: 'J7', nombre: 'PanelFormaPagoNota', formula: formulaFormaPagoNota() },
    { a1: 'J9', nombre: 'PanelFormaPagoTabla', filas: 8, columnas: 4, formula: formulaFormaPago() },
    { a1: 'J17', formula: '=IFERROR(INDEX(FILTER(K9:K16,J9:J16="Total"),1),"")' },
    { a1: 'J18', formula: '=IF(PanelFormaPago="Efectivo","es lo que hay que sacar del cajero este mes",' +
      '"es lo presupuestado con "&PanelFormaPago&" este mes")' },
    { a1: 'J20', valor: 'Ingresos del mes' },
    { a1: 'J21', nombre: 'PanelIngresosMes', filas: 3, columnas: 2,
      formula: `={"Planeado",${calc(1)};"Llegó",IF(${calc(3)},${calc(2)},"");"Diferencia",IF(${calc(3)},${calc(2)}-${calc(1)},"")}` },
    { a1: 'J24', nombre: 'PanelTasa', filas: 3, columnas: 2,
      formula: `=IF(CfgUsarSegunda,{"Tasa para planear",IF(${calc(4)}="","falta",${calc(4)});"Tasa real",` +
        `IF(${calc(5)}="","pendiente",${calc(5)});"Diferencia por la tasa",${calc(7)}},{"","";"","";"",""})` },
    { a1: 'J27', nombre: 'PanelAvisoTasa',
      formula: `=IF(NOT(CfgUsarSegunda),"",IF(${calc(8)},"Falta la tasa para planear",IF(${calc(6)}>0,"Faltan "&CfgSegundaMoneda&" "&TEXT(${calc(6)},"#,##0")&" por cambiar","")))` },
    { a1: 'J28', valor: 'Reparto contra la meta' },
    { a1: 'J30', nombre: 'PanelTipos', filas: 6, columnas: 5, formula: formulaTipos() },
    { a1: 'J37', valor: 'Por persona' },
    { a1: 'J39', nombre: 'PanelPersonas', filas: 8, columnas: 4, formula: formulaPersonas() },
    { a1: 'AJ11', nombre: 'PanelAno', filas: CONFIG.MESES, columnas: 3,
      formula: `={${Array.from({ length: CONFIG.MESES }, (_, k) => `DATE(CfgAno,CfgMesInicio+${k},1)`).join(';')}}` },
    { a1: 'AK11', formula: formulaAno('presupuestado') },
    { a1: 'AL11', formula: formulaAno('real') },
  ];
  const encabezados = [
    [`B${f - 1}`, ['Grupo', 'Gasto', 'Presupuestado', 'Real', 'Diferencia', 'Avance', 'Estado']],
    ['J8', ['Persona', 'Presupuestado', 'Gastado', 'Falta']],
    ['J29', ['Tipo', 'Nombre', 'Real', '% del ingreso', 'Meta']],
    ['J38', ['Persona', 'Ingresa', 'Presupuesta', 'Le queda']],
    ['AJ10', ['Mes', 'Presupuestado', 'Real']],
  ];
  for (const [inicio, titulos] of encabezados) {
    const [, col, fila] = inicio.match(/^([A-Z]+)(\d+)$/);
    const n = [...col].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);
    titulos.forEach((valor, k) => celdas.push({ a1: `${letra(n + k)}${fila}`, valor, encabezado: true }));
  }
  for (let fila = f; fila <= u; fila++) celdas.push({ a1: `G${fila}`, formula: formulaBarra(fila) });
  return { celdas };
}

/** Escribe el Panel con la distribución del boceto aprobado. Requiere Configuración, _Listas, Gastos e Ingresos. */
function construirPanel(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.panel);
  const P = CONFIG.PALETA;
  const f = FILA_TABLA;
  const u = ULTIMA_FILA_TABLA;
  const numero = '#,##0';
  const r = (a1) => sh.getRange(a1);
  asegurarColumnas(sh, 38);

  r(`A1:N${u}`).setFontFamily('Bricolage Grotesque').setFontColor(P.ink).setFontSize(10).setVerticalAlignment('middle');
  sh.setHiddenGridlines(true);

  for (const c of disenoPanel(datos).celdas) {
    const celda = r(c.a1);
    if (c.formula) celda.setFormula(c.formula); else celda.setValue(c.valor);
    if (c.encabezado) celda.setFontColor(P.muted).setFontWeight('bold');
    if (c.nombre) ss.setNamedRange(c.nombre, sh.getRange(celda.getRow(), celda.getColumn(), c.filas || 1, c.columnas || 1));
    if (c.lista) {
      celda.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInRange(ss.getRangeByName(c.lista), true).setAllowInvalid(false).build());
    }
  }

  // Cabecera oscura: nombre, año, selector de mes y avance del mes.
  r('A1:N4').setBackground(P.deep).setFontColor(P.line);
  r('B1').setFontSize(22).setFontWeight('bold').setFontColor(P.surface);
  r('K1').setHorizontalAlignment('right').setFontWeight('bold');
  r('L1:N1').merge().setBackground(P.surface).setFontColor(P.ink).setFontWeight('bold').setNumberFormat('mmmm yyyy');
  r('B3:N3').merge();
  r('B4:H4').merge();
  sh.setRowHeight(1, 44);
  sh.setRowHeight(3, 12);

  // Cifras grandes.
  for (const par of ['B6:C6', 'B7:C7', 'D6:E6', 'D7:E7', 'F6:H6', 'F7:H7', 'B8:H8']) r(par).merge();
  r('B6:H6').setFontColor(P.muted).setFontSize(9);
  r('B7:H7').setFontSize(18).setFontWeight('bold').setNumberFormat(numero).setHorizontalAlignment('left');
  r('F6:H7').setBackground(P.primary).setFontColor(P.surface);
  r('B6:H7').setBorder(true, true, true, true, true, false, P.line, SpreadsheetApp.BorderStyle.SOLID);
  r('B8').setFontColor(P.muted).setFontSize(9);
  sh.setRowHeight(7, 34);

  // Tabla del mes.
  for (const t of ['B10', `B${f - 2}`, 'J28', 'J37']) r(t).setFontColor(P.primary).setFontWeight('bold').setFontSize(12);
  r(`B${f - 1}:H${f - 1}`).setBorder(null, null, true, null, null, null, P.line, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  r(`D${f - 1}:F${u}`).setHorizontalAlignment('right');
  r(`D${f}:E${u}`).setNumberFormat(numero);
  r(`F${f}:F${u}`).setNumberFormat('"quedan "#,##0;"se pasó "#,##0;0');
  r(`B${f}:B${u}`).setFontWeight('bold');
  r(`H${f}:H${u}`).setFontWeight('bold');
  const estados = r(`H${f}:H${u}`);
  const regla = (texto, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(texto).setFontColor(color).setRanges([estados]).build();
  sh.setConditionalFormatRules([
    ...['Excedido', 'Va rápido'].map((t) => regla(t, P.warn)),
    ...['Pagado', 'En ritmo'].map((t) => regla(t, P.primary)),
    ...['Pendiente', 'Pago parcial'].map((t) => regla(t, P.muted)),
  ]);

  // Recuadros oscuros: forma de pago e ingresos.
  for (const caja of ['J6:N18', 'J20:N27']) r(caja).setBackground(P.deep).setFontColor(P.ground);
  for (const t of ['J6', 'J20']) r(t).setFontColor(P.surface).setFontWeight('bold').setFontSize(12);
  r('L6:N6').merge().setBackground(P.surface).setFontColor(P.ink).setFontWeight('bold');
  r('J7:N7').merge().setFontColor(P.line).setFontSize(9);
  r('J8:M8').setFontColor(P.line);
  r('K8:M16').setHorizontalAlignment('right');
  r('K9:M16').setNumberFormat(numero);
  r('J17:K17').merge().setFontSize(16).setFontWeight('bold').setFontColor(P.surface).setNumberFormat(numero).setHorizontalAlignment('left');
  r('J18:N18').merge().setFontColor(P.line).setFontSize(9);
  r('K21:K26').setNumberFormat(numero).setHorizontalAlignment('right');
  r('J27:N27').merge().setFontWeight('bold').setFontColor(P.surface);

  // Reparto y personas.
  r('L29:N29').setHorizontalAlignment('right');
  r('L30:L35').setNumberFormat(numero);
  r('M30:N35').setNumberFormat('0%');
  r('K38:M38').setHorizontalAlignment('right');
  r('K39:M46').setNumberFormat(numero);

  // Año: datos en columnas ocultas y gráfico entre las cifras grandes y la tabla.
  r('AJ11:AJ22').setNumberFormat('mmm');
  r('AK11:AL22').setNumberFormat(numero);
  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(r('AJ10:AL22'))
    .setNumHeaders(1).setHiddenDimensionStrategy(Charts.ChartHiddenDimensionStrategy.SHOW_BOTH)
    .setPosition(11, 2, 0, 0).setOption('width', 820).setOption('height', 230)
    .setOption('colors', [P.line, P.primary]).setOption('legend', { position: 'bottom' }).build());

  [16, 100, 170, 110, 110, 125, 110, 105, 28, 160, 105, 105, 105, 60].forEach((ancho, i) => sh.setColumnWidth(i + 1, ancho));
  sh.hideColumns(26, 13);
  sh.setFrozenRows(4);
  sh.protect().setDescription('Panel: solo los selectores son editables').setWarningOnly(true);
}
