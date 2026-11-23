/**
 * Pestaña Panel: resumen del mes elegido. Las fórmulas reproducen las reglas de calcularMes y
 * calcularFormaPago (oraculo.js) y se escriben en sintaxis en_US.
 */

const FILA_TABLA = 11;
const FILAS_TABLA = CONFIG.FILAS_GASTOS;
const ULTIMA_FILA_TABLA = FILA_TABLA + FILAS_TABLA - 1;
const MESES_CONSTANTE = `{${Array.from({ length: CONFIG.MESES }, (_, k) => k).join(';')}}`;

/**
 * Variables LET comunes sobre Gastos para el mes `indice`: columnas, presupuesto y real del mes, y las
 * marcas de cada fila (parte de un gasto existente, gasto con partes, gasto propio).
 */
function letGastos(indice) {
  return `i,${indice},nm,Gastos!$A$3:$A,gr,Gastos!$B$3:$B,pd,Gastos!$C$3:$C,tp,Gastos!$D$3:$D,cm,Gastos!$E$3:$E,` +
    'pe,Gastos!$F$3:$F,pg,Gastos!$G$3:$G,pr,INDEX(Gastos!$H$3:$AE,0,2*i+1),rr,INDEX(Gastos!$H$3:$AE,0,2*i+2),' +
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
    'pp,IF(ISNUMBER(pr),pr,0),re,IF(ISNUMBER(rr),rr,0),usd,(fm=CfgSegundaMoneda)*(fm<>""),' +
    'tr,INDEX(Ingresos!$D$3:$AA,1,2*i+1),tieneTasa,ISNUMBER(tr),tasa,IF(tieneTasa,tr,0),' +
    'cmes,Ingresos!$AC$3:$AC,cd,Ingresos!$AE$3:$AE,ct,Ingresos!$AF$3:$AF,' +
    'ok,(cmes>=ini)*(cmes<EDATE(ini,1))*ISNUMBER(cd)*ISNUMBER(ct),dol,IF(ISNUMBER(cd),cd,0),tas,IF(ISNUMBER(ct),ct,0),' +
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
    `iusd,(fm=CfgSegundaMoneda)*(fm<>""),realUsd,${calc(9)},usdReal,${calc(10)},` +
    'ing,MAP(per,LAMBDA(x,SUMPRODUCT((ipe=x)*(1-iusd)*ire)+IF(usdReal>0,realUsd*SUMPRODUCT((ipe=x)*iusd*ire)/usdReal,0))),' +
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
  return `=IF(B${fila}="","",SPARKLINE(MIN(F${fila},1),{"charttype","bar";"max",1;` +
    `"color1",IF(F${fila}>1,"${warn}","${primary}")}))`;
}

/** Celdas del Panel: posición, rango con nombre (y su tamaño), fórmula o valor y, en los selectores, su lista. */
function disenoPanel(datos) {
  const f = FILA_TABLA;
  const formas = (datos ? datos.config : CONFIG.DEFECTOS).formasPago.filter((x) => x.activa);
  const { accent } = CONFIG.PALETA;
  const celdas = [
    { a1: 'A1', formula: '=CfgNombre' },
    { a1: 'A2', formula: '="Presupuesto "&CfgAno' },
    { a1: 'H1', valor: 'Mes' },
    { a1: 'I1', nombre: 'PanelMes', valor: 'Mes actual', lista: 'ListaMesesPanel' },
    { a1: 'H2', formula: formulaDia() },
    { a1: 'A3', formula: `=SPARKLINE(PanelFraccion,{"charttype","bar";"max",1;"color1","${accent}"})` },
    { a1: 'Z1', nombre: 'PanelIndice', formula: formulaIndice() },
    { a1: 'Z2', nombre: 'PanelMesInicio', formula: '=DATE(CfgAno,CfgMesInicio+PanelIndice,1)' },
    { a1: 'Z3', nombre: 'PanelFraccion', formula: formulaFraccion() },
    { a1: 'Z5', nombre: 'PanelIngresosCalc', filas: 10, formula: formulaIngresosCalc() },

    { a1: 'A5', nombre: 'PanelIngresosEtiqueta', formula: `=IF(${calc(3)},"Ingresos","Ingresos (planeados)")` },
    { a1: 'A6', nombre: 'PanelIngresos', formula: `=IF(${calc(3)},${calc(2)},${calc(1)})` },
    { a1: 'C5', valor: 'Gastado hasta hoy' },
    { a1: 'C6', nombre: 'PanelGastado', formula: `=SUM(D${f}:D)` },
    { a1: 'E5', valor: 'Queda del presupuesto' },
    { a1: 'E6', nombre: 'PanelQueda', formula: '=PanelPresupuestado-PanelGastado' },
    { a1: 'A7', valor: 'Presupuestado' },
    { a1: 'B7', nombre: 'PanelPresupuestado', formula: `=SUM(C${f}:C)` },
    { a1: 'C7', nombre: 'PanelSinAsignarEtiqueta', formula: '=IF(PanelSinAsignar<0,"Sobre-asignado","Sin asignar")' },
    { a1: 'E7', nombre: 'PanelSinAsignar', formula: `=${calc(1)}-PanelPresupuestado` },

    { a1: 'A9', valor: 'Presupuestado contra real' },
    { a1: `A${f}`, nombre: 'PanelTabla', filas: FILAS_TABLA, columnas: 7, formula: formulaTabla() },

    { a1: 'J5', valor: 'Forma de pago' },
    { a1: 'K5', nombre: 'PanelFormaPago', valor: formas.length ? formas[0].nombre : '', lista: 'ListaFormasPago' },
    { a1: 'J6', nombre: 'PanelFormaPagoNota', formula: formulaFormaPagoNota() },
    { a1: 'J8', nombre: 'PanelFormaPagoTabla', filas: 13, columnas: 4, formula: formulaFormaPago() },
    { a1: 'J22', valor: 'Ingresos del mes' },
    { a1: 'J23', nombre: 'PanelTasa', filas: 2, columnas: 2,
      formula: `={"Tasa para planear",IF(${calc(4)}="","falta",${calc(4)});"Tasa real",IF(${calc(5)}="","pendiente",${calc(5)})}` },
    { a1: 'J25', nombre: 'PanelIngresosMes', filas: 3, columnas: 2,
      formula: `={"Planeado",${calc(1)};"Llegó",IF(${calc(3)},${calc(2)},"");"Diferencia por la tasa",${calc(7)}}` },
    { a1: 'J28', nombre: 'PanelAvisoTasa',
      formula: `=IF(${calc(8)},"Falta la tasa para planear",IF(${calc(6)}>0,"Faltan "&CfgSegundaMoneda&" "&TEXT(${calc(6)},"#,##0")&" por cambiar",""))` },
    { a1: 'J30', valor: 'Reparto contra la meta' },
    { a1: 'J32', nombre: 'PanelTipos', filas: 10, columnas: 5, formula: formulaTipos() },
    { a1: 'J43', valor: 'Por persona' },
    { a1: 'J45', nombre: 'PanelPersonas', filas: 12, columnas: 4, formula: formulaPersonas() },
    { a1: 'P9', valor: 'El año de un vistazo' },
    { a1: 'P11', nombre: 'PanelAno', filas: CONFIG.MESES, columnas: 3,
      formula: `={${Array.from({ length: CONFIG.MESES }, (_, k) => `DATE(CfgAno,CfgMesInicio+${k},1)`).join(';')}}` },
    { a1: 'Q11', formula: formulaAno('presupuestado') },
    { a1: 'R11', formula: formulaAno('real') },
  ];
  const encabezados = [
    [`A${f - 1}`, ['Grupo', 'Gasto', 'Presupuestado', 'Real', 'Diferencia', 'Avance', 'Estado']],
    ['J7', ['Persona', 'Presupuestado', 'Gastado', 'Falta']],
    ['J31', ['Tipo', 'Nombre', 'Real', '% del ingreso', 'Meta']],
    ['J44', ['Persona', 'Ingresa', 'Presupuesta', 'Le queda']],
    ['P10', ['Mes', 'Presupuestado', 'Real']],
  ];
  for (const [inicio, titulos] of encabezados) {
    const [, col, fila] = inicio.match(/^([A-Z]+)(\d+)$/);
    titulos.forEach((valor, k) => celdas.push({ a1: `${String.fromCharCode(col.charCodeAt(0) + k)}${fila}`, valor, encabezado: true }));
  }
  for (let fila = f; fila <= ULTIMA_FILA_TABLA; fila++) celdas.push({ a1: `H${fila}`, formula: formulaBarra(fila) });
  return { celdas };
}

/** Escribe el Panel con el formato del boceto aprobado. Requiere Configuración, _Listas, Gastos e Ingresos. */
function construirPanel(ss, datos) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.panel);
  const P = CONFIG.PALETA;
  const f = FILA_TABLA;
  const u = ULTIMA_FILA_TABLA;
  const numero = '#,##0';

  sh.getRange('A1:Z120').setFontFamily('Bricolage Grotesque').setFontColor(P.ink).setFontSize(10);
  sh.setHiddenGridlines(true);
  sh.getRange('I1').setNumberFormat('mmmm yyyy');

  for (const c of disenoPanel(datos).celdas) {
    const r = sh.getRange(c.a1);
    if (c.formula) r.setFormula(c.formula); else r.setValue(c.valor);
    if (c.encabezado) r.setFontColor(P.muted).setFontWeight('bold');
    if (c.nombre) ss.setNamedRange(c.nombre, sh.getRange(r.getRow(), r.getColumn(), c.filas || 1, c.columnas || 1));
    if (c.lista) {
      r.setDataValidation(SpreadsheetApp.newDataValidation()
        .requireValueInRange(ss.getRangeByName(c.lista), true).setAllowInvalid(false).build());
    }
  }

  sh.getRange('A1:Z2').setBackground(P.deep).setFontColor(P.ground);
  sh.getRange('A1').setFontSize(20).setFontWeight('bold');
  sh.getRange('I1').setBackground(P.surface).setFontColor(P.ink).setFontWeight('bold');
  sh.getRange('A3:G3').merge();
  sh.setRowHeight(1, 40);

  sh.getRange('A5:F5').setFontColor(P.muted).setFontSize(9);
  sh.getRange('A6:F6').setFontSize(16).setFontWeight('bold').setNumberFormat(numero).setHorizontalAlignment('left');
  sh.getRange('E5:F6').setBackground(P.primary).setFontColor(P.surface);
  sh.getRange('A5:F6').setBorder(true, true, true, true, true, false, P.line, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A7:E7').setFontColor(P.muted);
  sh.getRange('B7').setNumberFormat(numero);
  sh.getRange('E7').setNumberFormat(numero);

  for (const t of ['A9', 'J5', 'J22', 'J30', 'J43', 'P9']) sh.getRange(t).setFontColor(P.primary).setFontWeight('bold').setFontSize(11);
  sh.getRange(`A${f - 1}:H${f - 1}`).setBorder(null, null, true, null, null, null, P.line, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.getRange(`C${f}:D${u}`).setNumberFormat(numero);
  sh.getRange(`E${f}:E${u}`).setNumberFormat('"quedan "#,##0;"se pasó "#,##0;0');
  sh.getRange(`F${f}:F${u}`).setNumberFormat('0%');
  sh.getRange(`G${f}:G${u}`).setFontWeight('bold');
  sh.getRange(`C${f - 1}:F${u}`).setHorizontalAlignment('right');

  sh.getRange('J5:M20').setBackground(P.deep).setFontColor(P.ground);
  sh.getRange('K5').setBackground(P.surface).setFontColor(P.ink).setFontWeight('bold');
  sh.getRange('K8:M20').setNumberFormat(numero);
  sh.getRange('J22:K28').setBackground(P.deep).setFontColor(P.ground);
  sh.getRange('K23:K27').setNumberFormat(numero);
  sh.getRange('L32:L41').setNumberFormat(numero);
  sh.getRange('M32:N41').setNumberFormat('0%');
  sh.getRange('K45:M56').setNumberFormat(numero);
  sh.getRange('P11:P22').setNumberFormat('mmm');
  sh.getRange('Q11:R22').setNumberFormat(numero);

  const estados = sh.getRange(`G${f}:G${u}`);
  const regla = (texto, color) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(texto).setFontColor(color).setRanges([estados]).build();
  sh.setConditionalFormatRules([
    ...['Excedido', 'Va rápido'].map((t) => regla(t, P.warn)),
    ...['Pagado', 'En ritmo'].map((t) => regla(t, P.primary)),
    ...['Pendiente', 'Pago parcial'].map((t) => regla(t, P.muted)),
  ]);

  sh.insertChart(sh.newChart().setChartType(Charts.ChartType.COLUMN).addRange(sh.getRange('P10:R22'))
    .setNumHeaders(1).setPosition(58, 10, 0, 0)
    .setOption('colors', [P.line, P.primary]).setOption('legend', { position: 'bottom' }).build());

  [110, 170, 110, 110, 120, 70, 110, 120, 24, 130, 110, 110, 100, 80].forEach((ancho, i) => sh.setColumnWidth(i + 1, ancho));
  sh.hideColumns(26);
  sh.setFrozenRows(2);
  sh.protect().setDescription('Panel: solo los selectores son editables').setWarningOnly(true);
}
