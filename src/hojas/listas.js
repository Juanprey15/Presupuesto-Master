/** Pestaña oculta _Listas: listas de los desplegables calculadas desde Configuración y Gastos. */

function formulasListas() {
  const activos = (nombre, activo) => `IFERROR(FILTER(${nombre},${activo}=TRUE,${nombre}<>""))`;
  const meses = Array.from({ length: CONFIG.MESES }, (_, i) => `DATE(CfgAno,CfgMesInicio+${i},1)`).join(';');
  return [
    { nombre: 'ListaPersonas', formula: `=${activos('CfgPersonasNombre', 'CfgPersonasActiva')}` },
    { nombre: 'ListaFormasPago', formula: `=${activos('CfgFormasPagoNombre', 'CfgFormasPagoActiva')}` },
    {
      nombre: 'ListaGrupos',
      formula: '=IFERROR(SORT(FILTER(CfgGruposNombre,CfgGruposActivo=TRUE,CfgGruposNombre<>""),' +
        'FILTER(CfgGruposOrden,CfgGruposActivo=TRUE,CfgGruposNombre<>""),TRUE))',
    },
    { nombre: 'ListaTipos', formula: '=IFERROR(FILTER(CfgTiposLetra,CfgTiposLetra<>""))' },
    { nombre: 'ListaMonedas', formula: '={CfgMoneda;CfgSegundaMoneda}' },
    { nombre: 'ListaGastosPadre', formula: '=IFERROR(UNIQUE(FILTER(Gastos!$A$3:$A,Gastos!$C$3:$C="",Gastos!$A$3:$A<>"")))' },
    { nombre: 'ListaMesesAno', formula: `={${meses}}`, formato: 'mmmm yyyy' },
    { nombre: 'ListaMesesPanel', formula: `={"Mes actual";${meses}}`, formato: 'mmmm yyyy' },
  ];
}

/** Escribe las fórmulas de _Listas (fila 1 nombre, fila 2 fórmula) y define un rango con nombre por lista. */
function construirListas(ss) {
  const sh = ss.getSheetByName(CONFIG.HOJAS.listas);
  formulasListas().forEach((l, i) => {
    const columna = i + 1;
    sh.getRange(1, columna).setValue(l.nombre).setFontWeight('bold');
    sh.getRange(2, columna).setFormula(l.formula);
    const rango = sh.getRange(2, columna, sh.getMaxRows() - 1, 1);
    if (l.formato) rango.setNumberFormat(l.formato);
    ss.setNamedRange(l.nombre, rango);
  });
}
